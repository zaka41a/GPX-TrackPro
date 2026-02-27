package store

import (
	"context"
	"strings"
	"time"
)

type CommunityPost struct {
	ID           int64     `json:"id"`
	AuthorID     int64     `json:"authorId"`
	AuthorName   string    `json:"authorName"`
	AuthorAvatar string    `json:"authorAvatar"`
	ActivityID   *int64    `json:"activityId,omitempty"`
	Content      string    `json:"content"`
	Pinned       bool      `json:"pinned"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	Reactions    []ReactionCount `json:"reactions"`
	CommentCount int       `json:"commentCount"`
}

type ReactionCount struct {
	Emoji   string `json:"emoji"`
	Count   int    `json:"count"`
	Reacted bool   `json:"reacted"`
}

type CommunityComment struct {
	ID           int64     `json:"id"`
	PostID       int64     `json:"postId"`
	AuthorID     int64     `json:"authorId"`
	AuthorName   string    `json:"authorName"`
	AuthorAvatar string    `json:"authorAvatar"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"createdAt"`
}

type CommunityReaction struct {
	ID        int64     `json:"id"`
	PostID    int64     `json:"postId"`
	UserID    int64     `json:"userId"`
	Emoji     string    `json:"emoji"`
	CreatedAt time.Time `json:"createdAt"`
}

type CommunityBan struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	UserName  string    `json:"userName"`
	UserEmail string    `json:"userEmail"`
	BannedBy  int64     `json:"bannedBy"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Store) CreatePost(ctx context.Context, authorID int64, content string, activityID *int64) (CommunityPost, error) {
	query := `
		INSERT INTO community_posts (author_id, content, activity_id)
		VALUES ($1, $2, $3)
		RETURNING id, author_id, activity_id, content, pinned, created_at, updated_at
	`
	var p CommunityPost
	err := s.pool.QueryRow(ctx, query, authorID, content, activityID).Scan(
		&p.ID, &p.AuthorID, &p.ActivityID, &p.Content, &p.Pinned, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return CommunityPost{}, err
	}
	p.Reactions = []ReactionCount{}
	return p, nil
}

func (s *Store) GetPost(ctx context.Context, id int64) (CommunityPost, error) {
	query := `
		SELECT p.id, p.author_id, CONCAT(u.first_name, ' ', u.last_name) AS author_name,
			u.avatar_url,
			p.activity_id, p.content, p.pinned, p.created_at, p.updated_at,
			(SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS comment_count
		FROM community_posts p
		JOIN users u ON u.id = p.author_id
		WHERE p.id = $1
	`
	var p CommunityPost
	err := s.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorAvatar, &p.ActivityID, &p.Content,
		&p.Pinned, &p.CreatedAt, &p.UpdatedAt, &p.CommentCount,
	)
	if err != nil {
		return CommunityPost{}, err
	}
	p.Reactions = []ReactionCount{}
	return p, nil
}

type PostListResult struct {
	Posts      []CommunityPost `json:"posts"`
	NextCursor *int64          `json:"nextCursor"`
}

func (s *Store) ListPosts(ctx context.Context, cursor *int64, limit int, currentUserID int64, search string) (PostListResult, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	query := `
		SELECT p.id, p.author_id, CONCAT(u.first_name, ' ', u.last_name) AS author_name,
			u.avatar_url,
			p.activity_id, p.content, p.pinned, p.created_at, p.updated_at,
			(SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS comment_count
		FROM community_posts p
		JOIN users u ON u.id = p.author_id
	`
	args := make([]any, 0)
	argN := 1
	conditions := []string{}

	if cursor != nil {
		conditions = append(conditions, "p.id < $"+itoa(argN))
		args = append(args, *cursor)
		argN++
	}
	if search != "" {
		conditions = append(conditions, "p.content ILIKE $"+itoa(argN))
		args = append(args, "%"+search+"%")
		argN++
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += " ORDER BY p.pinned DESC, p.created_at DESC LIMIT $" + itoa(argN)
	args = append(args, limit+1)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return PostListResult{}, err
	}
	defer rows.Close()

	posts := make([]CommunityPost, 0)
	for rows.Next() {
		var p CommunityPost
		if err := rows.Scan(
			&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorAvatar, &p.ActivityID, &p.Content,
			&p.Pinned, &p.CreatedAt, &p.UpdatedAt, &p.CommentCount,
		); err != nil {
			return PostListResult{}, err
		}
		p.Reactions = []ReactionCount{}
		posts = append(posts, p)
	}
	if err := rows.Err(); err != nil {
		return PostListResult{}, err
	}

	var nextCursor *int64
	if len(posts) > limit {
		nextCursor = &posts[limit-1].ID
		posts = posts[:limit]
	}

	// Load reactions for all posts
	if len(posts) > 0 {
		postIDs := make([]int64, len(posts))
		for i, p := range posts {
			postIDs[i] = p.ID
		}
		reactions, err := s.LoadReactionsForPosts(ctx, postIDs, currentUserID)
		if err != nil {
			return PostListResult{}, err
		}
		for i := range posts {
			if r, ok := reactions[posts[i].ID]; ok {
				posts[i].Reactions = r
			}
		}
	}

	return PostListResult{Posts: posts, NextCursor: nextCursor}, nil
}

func (s *Store) LoadReactionsForPosts(ctx context.Context, postIDs []int64, currentUserID int64) (map[int64][]ReactionCount, error) {
	query := `
		SELECT r.post_id, r.emoji, COUNT(*) AS cnt,
			BOOL_OR(r.user_id = $1) AS reacted
		FROM community_reactions r
		WHERE r.post_id = ANY($2)
		GROUP BY r.post_id, r.emoji
		ORDER BY cnt DESC
	`
	rows, err := s.pool.Query(ctx, query, currentUserID, postIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[int64][]ReactionCount)
	for rows.Next() {
		var postID int64
		var rc ReactionCount
		if err := rows.Scan(&postID, &rc.Emoji, &rc.Count, &rc.Reacted); err != nil {
			return nil, err
		}
		result[postID] = append(result[postID], rc)
	}
	return result, rows.Err()
}

func (s *Store) DeletePost(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM community_posts WHERE id = $1`, id)
	return err
}

func (s *Store) PinPost(ctx context.Context, id int64, pinned bool) error {
	_, err := s.pool.Exec(ctx, `UPDATE community_posts SET pinned = $1, updated_at = now() WHERE id = $2`, pinned, id)
	return err
}

func (s *Store) CreateComment(ctx context.Context, postID, authorID int64, content string) (CommunityComment, error) {
	query := `
		INSERT INTO community_comments (post_id, author_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, post_id, author_id, content, created_at
	`
	var c CommunityComment
	err := s.pool.QueryRow(ctx, query, postID, authorID, content).Scan(
		&c.ID, &c.PostID, &c.AuthorID, &c.Content, &c.CreatedAt,
	)
	return c, err
}

func (s *Store) ListComments(ctx context.Context, postID int64) ([]CommunityComment, error) {
	query := `
		SELECT c.id, c.post_id, c.author_id, CONCAT(u.first_name, ' ', u.last_name) AS author_name,
			u.avatar_url, c.content, c.created_at
		FROM community_comments c
		JOIN users u ON u.id = c.author_id
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC
		LIMIT 200
	`
	rows, err := s.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]CommunityComment, 0)
	for rows.Next() {
		var c CommunityComment
		if err := rows.Scan(&c.ID, &c.PostID, &c.AuthorID, &c.AuthorName, &c.AuthorAvatar, &c.Content, &c.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

func (s *Store) DeleteComment(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM community_comments WHERE id = $1`, id)
	return err
}

func (s *Store) GetCommentAuthorID(ctx context.Context, id int64) (int64, error) {
	var authorID int64
	err := s.pool.QueryRow(ctx, `SELECT author_id FROM community_comments WHERE id = $1`, id).Scan(&authorID)
	return authorID, err
}

func (s *Store) GetPostAuthorID(ctx context.Context, id int64) (int64, error) {
	var authorID int64
	err := s.pool.QueryRow(ctx, `SELECT author_id FROM community_posts WHERE id = $1`, id).Scan(&authorID)
	return authorID, err
}

func (s *Store) ToggleReaction(ctx context.Context, postID, userID int64, emoji string) (bool, error) {
	// Try to insert; if conflict, delete instead
	var id int64
	err := s.pool.QueryRow(ctx,
		`INSERT INTO community_reactions (post_id, user_id, emoji) VALUES ($1, $2, $3)
		 ON CONFLICT (post_id, user_id, emoji) DO NOTHING
		 RETURNING id`,
		postID, userID, emoji,
	).Scan(&id)

	if err != nil {
		// Conflict occurred (no row returned) — delete instead
		_, delErr := s.pool.Exec(ctx,
			`DELETE FROM community_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3`,
			postID, userID, emoji,
		)
		if delErr != nil {
			return false, delErr
		}
		return false, nil
	}
	return true, nil
}

func (s *Store) BanUser(ctx context.Context, userID, bannedBy int64, reason string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO community_bans (user_id, banned_by, reason) VALUES ($1, $2, $3)
		 ON CONFLICT (user_id) DO UPDATE SET banned_by = $2, reason = $3, created_at = now()`,
		userID, bannedBy, reason,
	)
	return err
}

func (s *Store) UnbanUser(ctx context.Context, userID int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM community_bans WHERE user_id = $1`, userID)
	return err
}

func (s *Store) IsBanned(ctx context.Context, userID int64) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM community_bans WHERE user_id = $1)`, userID).Scan(&exists)
	return exists, err
}

func (s *Store) ListBans(ctx context.Context) ([]CommunityBan, error) {
	query := `
		SELECT b.id, b.user_id, CONCAT(u.first_name, ' ', u.last_name) AS user_name,
			u.email, b.banned_by, COALESCE(b.reason, ''), b.created_at
		FROM community_bans b
		JOIN users u ON u.id = b.user_id
		ORDER BY b.created_at DESC
	`
	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bans := make([]CommunityBan, 0)
	for rows.Next() {
		var b CommunityBan
		if err := rows.Scan(&b.ID, &b.UserID, &b.UserName, &b.UserEmail, &b.BannedBy, &b.Reason, &b.CreatedAt); err != nil {
			return nil, err
		}
		bans = append(bans, b)
	}
	return bans, rows.Err()
}
