/*
  SEED DATA for IdeaHub Development Environment
  Date: July 10, 2025
  
  This script populates the database with sample data for development purposes.
  The data includes sample users, ideas, comments, stars, follows, and notifications.
*/

-- Disable triggers temporarily for bulk loading
ALTER TABLE stars DISABLE TRIGGER update_idea_stars_trigger;
ALTER TABLE follows DISABLE TRIGGER update_follow_counts_trigger;

-- Clear existing data (if any)
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE stars CASCADE;
TRUNCATE TABLE follows CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE ideas CASCADE;
TRUNCATE TABLE users CASCADE;

-- Seed Users (with UUID values for consistency in references)
INSERT INTO users (id, username, email, full_name, avatar_url, bio, location, website, is_verified) VALUES
('d0416774-3308-4d47-b048-263f7b44cce0', 'techguru', 'techguru@example.com', 'Tech Guru', 'https://ui-avatars.com/api/?name=Tech+Guru&background=random', 'Passionate about technology and innovation', 'San Francisco, CA', 'https://techguru.dev', true),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'codemaster', 'codemaster@example.com', 'Code Master', 'https://ui-avatars.com/api/?name=Code+Master&background=random', 'Full-stack developer with 10+ years of experience', 'New York, NY', 'https://codemaster.dev', true),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'designwhiz', 'designwhiz@example.com', 'Design Whiz', 'https://ui-avatars.com/api/?name=Design+Whiz&background=random', 'UI/UX designer passionate about creating beautiful experiences', 'Seattle, WA', 'https://designwhiz.com', false),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'datascientist', 'datascientist@example.com', 'Data Scientist', 'https://ui-avatars.com/api/?name=Data+Scientist&background=random', 'Working on AI and machine learning projects', 'Boston, MA', 'https://datasci.tech', false),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', 'startupfounder', 'startupfounder@example.com', 'Startup Founder', 'https://ui-avatars.com/api/?name=Startup+Founder&background=random', 'Building the next big thing!', 'Austin, TX', 'https://mystartup.io', true);

-- Seed Ideas
INSERT INTO ideas (id, title, description, content, author_id, tags, category, language, stars, forks) VALUES
('f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548', 'AI-Powered Content Generator', 'A tool that uses AI to generate blog posts, articles, and marketing copy', 'This idea is about creating a web application that leverages GPT-4 or similar AI models to generate high-quality content. The user would provide a topic, keywords, and tone, and the AI would generate a full article or blog post ready for publishing. The application would also include features for editing, saving drafts, and exporting in various formats.', 'd0416774-3308-4d47-b048-263f7b44cce0', ARRAY['AI', 'content', 'writing', 'automation'], 'AI & Machine Learning', 'Python', 12, 3),

('e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89', 'Sustainable Energy Dashboard', 'A dashboard for monitoring and optimizing home energy usage', 'This project aims to create an interactive dashboard that connects to smart home devices and solar panels to monitor energy consumption and production. It will provide insights on how to reduce energy waste, optimize solar panel usage, and reduce carbon footprint. Features include real-time monitoring, historical data analysis, cost-saving recommendations, and integration with popular smart home ecosystems.', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', ARRAY['IoT', 'energy', 'sustainability', 'dashboard'], 'Green Technology', 'JavaScript', 8, 1),

('01ac77b9-1234-4569-9e45-3570c83c2241', 'Collaborative Design Platform', 'A web-based platform for real-time collaborative design projects', 'This platform will allow designers to collaborate in real-time on design projects. It will feature a canvas with vector editing capabilities, version history, commenting, and sharing options. The platform will support multiple file formats and integrate with popular design tools. It aims to streamline the design feedback process and enable seamless collaboration regardless of geographic location.', '7a8b93c4-ee35-4d62-a668-ffec992b2a9f', ARRAY['design', 'collaboration', 'platform', 'vector'], 'Design Tools', 'TypeScript', 15, 4),

('9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf', 'Predictive Health Analytics', 'An application that uses machine learning to predict health risks based on wearable data', 'This healthcare application will collect data from wearable devices like fitness trackers and smartwatches to provide predictive health analytics. Using machine learning algorithms, it will identify patterns that may indicate health risks, suggest preventive measures, and provide personalized health recommendations. The app will prioritize data privacy and allow users to control their data sharing preferences.', 'e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', ARRAY['health', 'ML', 'wearables', 'analytics'], 'Healthcare', 'Python', 7, 2),

('bd74c2b6-83d9-41f1-888c-7c2dffe98a14', 'Micro-Investment Platform', 'A platform that allows users to invest small amounts in various investment vehicles', 'This financial platform aims to make investing accessible to everyone by allowing micro-investments starting as low as $1. Users can invest in stocks, bonds, cryptocurrencies, and other investment vehicles without needing large capital. The platform will include educational resources, automated investment options, and social features for discussing investment strategies with other users.', '5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', ARRAY['finance', 'investment', 'fintech', 'accessibility'], 'Financial Technology', 'Java', 10, 0),

('65a9d63f-e01c-4e61-aa8e-95f68f317140', 'Remote Team Management Tool', 'A comprehensive tool for managing remote teams and workflows', 'This project focuses on creating a tool specifically designed for remote team management. It will include features such as time tracking across different time zones, project management, virtual standups, team building activities, and performance analytics. The tool aims to solve common challenges faced by remote teams such as communication gaps, isolation, and workflow management.', 'd0416774-3308-4d47-b048-263f7b44cce0', ARRAY['remote work', 'management', 'productivity', 'teams'], 'Productivity', 'TypeScript', 9, 2),

('a3d9ca68-67e0-42fa-98e9-078f9685819d', 'Personalized Learning Platform', 'An adaptive learning platform that customizes education based on individual learning styles', 'This education platform uses AI to identify individual learning styles and preferences, then customizes educational content accordingly. It covers subjects from elementary to university level, tracks progress, and adjusts difficulty based on performance. The platform aims to make learning more efficient and enjoyable through personalization.', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', ARRAY['education', 'learning', 'AI', 'personalization'], 'Education', 'Python', 11, 3);

-- Seed Comments
INSERT INTO comments (id, content, author_id, idea_id, parent_id, votes) VALUES
('5df1c4d2-605f-4e03-aacd-0b28ea7aca32', 'This is a brilliant idea! Have you considered incorporating sentiment analysis to adjust the tone of the generated content?', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548', NULL, 3),
('67a70c72-6c9a-4340-9f8b-e8fcf95a6436', 'Thanks for the feedback! Sentiment analysis is definitely on our roadmap for the next version.', 'd0416774-3308-4d47-b048-263f7b44cce0', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548', '5df1c4d2-605f-4e03-aacd-0b28ea7aca32', 1),
('94ebf123-9e7c-4a17-a9cf-8530e76143bc', 'I would love to see this integrate with existing smart home systems like HomeKit or Google Home.', '7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89', NULL, 4),
('1ecb610a-0749-4b89-a965-144fed68131d', 'Have you looked into HIPAA compliance for this application? It would be crucial for adoption in the healthcare sector.', '5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf', NULL, 2),
('b21fc92d-3c2d-4d0e-b6ea-c957d5c85ff9', 'Absolutely, HIPAA compliance is our top priority. We''re working with legal experts to ensure we meet all requirements.', 'e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf', '1ecb610a-0749-4b89-a965-144fed68131d', 1),
('cdff9f3b-e1a7-429a-92b7-d2a074774b78', 'I think the collaborative aspect is what makes this stand out from other design tools. Great concept!', 'e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', '01ac77b9-1234-4569-9e45-3570c83c2241', NULL, 3),
('882a9f4a-2afc-46e9-8dff-c57c4eb0b11e', 'Would this platform support fractional shares for stocks with high per-share prices?', 'd0416774-3308-4d47-b048-263f7b44cce0', 'bd74c2b6-83d9-41f1-888c-7c2dffe98a14', NULL, 2),
('3c5f7c9d-8f1e-4a2b-8e79-1061874e393a', 'This is something we need desperately in our company! Looking forward to trying it out.', 'e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', '65a9d63f-e01c-4e61-aa8e-95f68f317140', NULL, 2);

-- Seed Stars
INSERT INTO stars (user_id, idea_id) VALUES
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548'),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548'),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548'),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548'),
('d0416774-3308-4d47-b048-263f7b44cce0', 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89'),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89'),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89'),
('d0416774-3308-4d47-b048-263f7b44cce0', '01ac77b9-1234-4569-9e45-3570c83c2241'),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', '01ac77b9-1234-4569-9e45-3570c83c2241'),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', '01ac77b9-1234-4569-9e45-3570c83c2241'),
('d0416774-3308-4d47-b048-263f7b44cce0', '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf'),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf'),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'bd74c2b6-83d9-41f1-888c-7c2dffe98a14'),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'bd74c2b6-83d9-41f1-888c-7c2dffe98a14'),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', 'bd74c2b6-83d9-41f1-888c-7c2dffe98a14');

-- Seed Follows
INSERT INTO follows (follower_id, following_id) VALUES
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'd0416774-3308-4d47-b048-263f7b44cce0'),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'd0416774-3308-4d47-b048-263f7b44cce0'),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'd0416774-3308-4d47-b048-263f7b44cce0'),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', 'd0416774-3308-4d47-b048-263f7b44cce0'),
('d0416774-3308-4d47-b048-263f7b44cce0', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f'),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f'),
('d0416774-3308-4d47-b048-263f7b44cce0', '7a8b93c4-ee35-4d62-a668-ffec992b2a9f'),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', '7a8b93c4-ee35-4d62-a668-ffec992b2a9f');

-- Seed Notifications
INSERT INTO notifications (user_id, type, message, related_user_id, related_idea_id, is_read) VALUES
('d0416774-3308-4d47-b048-263f7b44cce0', 'star', 'codemaster starred your idea: AI-Powered Content Generator', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548', false),
('d0416774-3308-4d47-b048-263f7b44cce0', 'comment', 'codemaster commented on your idea: AI-Powered Content Generator', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548', false),
('d0416774-3308-4d47-b048-263f7b44cce0', 'follow', 'codemaster started following you', 'ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', NULL, true),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'star', 'techguru starred your idea: Sustainable Energy Dashboard', 'd0416774-3308-4d47-b048-263f7b44cce0', 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89', false),
('ccc5884b-95e3-4ab7-90ef-a0ad5a0cb00f', 'follow', 'techguru started following you', 'd0416774-3308-4d47-b048-263f7b44cce0', NULL, true),
('7a8b93c4-ee35-4d62-a668-ffec992b2a9f', 'star', 'techguru starred your idea: Collaborative Design Platform', 'd0416774-3308-4d47-b048-263f7b44cce0', '01ac77b9-1234-4569-9e45-3570c83c2241', false),
('e7414a3e-789f-4e0f-b63f-6d4c7b4b4541', 'comment', 'startupfounder commented on your idea: Predictive Health Analytics', '5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf', false),
('5b9a48ad-f4f7-4402-ac8c-7a91e3c1e147', 'comment', 'techguru commented on your idea: Micro-Investment Platform', 'd0416774-3308-4d47-b048-263f7b44cce0', 'bd74c2b6-83d9-41f1-888c-7c2dffe98a14', false);

-- Re-enable triggers
ALTER TABLE stars ENABLE TRIGGER update_idea_stars_trigger;
ALTER TABLE follows ENABLE TRIGGER update_follow_counts_trigger;

-- Update the counters manually to match our seeded data
-- Update idea star counts
UPDATE ideas SET stars = (SELECT COUNT(*) FROM stars WHERE stars.idea_id = ideas.id);

-- Update user follow counts
UPDATE users SET 
  followers = (SELECT COUNT(*) FROM follows WHERE follows.following_id = users.id),
  following = (SELECT COUNT(*) FROM follows WHERE follows.follower_id = users.id);

-- Update idea fork counts (we didn't create actual forked ideas, just setting the counts)
UPDATE ideas SET
  forks = CASE 
    WHEN id = 'f7c9bd6a-d64a-4ce3-9cf8-a1a3f4b22548' THEN 3
    WHEN id = 'e08fe975-8c09-4bc8-a2a8-bdcc9f57bf89' THEN 1
    WHEN id = '01ac77b9-1234-4569-9e45-3570c83c2241' THEN 4
    WHEN id = '9d4f60e4-5a2b-4ce4-b7e9-932d7b1d3fcf' THEN 2
    WHEN id = '65a9d63f-e01c-4e61-aa8e-95f68f317140' THEN 2
    WHEN id = 'a3d9ca68-67e0-42fa-98e9-078f9685819d' THEN 3
    ELSE forks
  END;

-- Add a function to create a notification when a user stars an idea
CREATE OR REPLACE FUNCTION create_star_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id <> (SELECT author_id FROM ideas WHERE id = NEW.idea_id) THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      related_user_id,
      related_idea_id
    )
    SELECT
      ideas.author_id,
      'star',
      (SELECT username FROM users WHERE id = NEW.user_id) || ' starred your idea: ' || ideas.title,
      NEW.user_id,
      NEW.idea_id
    FROM ideas
    WHERE ideas.id = NEW.idea_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for star notifications
CREATE TRIGGER create_star_notification_trigger
  AFTER INSERT ON stars
  FOR EACH ROW EXECUTE FUNCTION create_star_notification();

-- Add a function to create a notification when a user comments on an idea
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify idea author if commenter is not the author
  IF NEW.author_id <> (SELECT author_id FROM ideas WHERE id = NEW.idea_id) THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      related_user_id,
      related_idea_id
    )
    SELECT
      ideas.author_id,
      'comment',
      (SELECT username FROM users WHERE id = NEW.author_id) || ' commented on your idea: ' || ideas.title,
      NEW.author_id,
      NEW.idea_id
    FROM ideas
    WHERE ideas.id = NEW.idea_id;
  END IF;
  
  -- Notify parent comment author if this is a reply
  IF NEW.parent_id IS NOT NULL AND NEW.author_id <> (SELECT author_id FROM comments WHERE id = NEW.parent_id) THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      related_user_id,
      related_idea_id
    )
    SELECT
      comments.author_id,
      'comment',
      (SELECT username FROM users WHERE id = NEW.author_id) || ' replied to your comment',
      NEW.author_id,
      NEW.idea_id
    FROM comments
    WHERE comments.id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for comment notifications
CREATE TRIGGER create_comment_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Add a function to create a notification when a user follows another user
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    message,
    related_user_id
  )
  VALUES (
    NEW.following_id,
    'follow',
    (SELECT username FROM users WHERE id = NEW.follower_id) || ' started following you',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for follow notifications
CREATE TRIGGER create_follow_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();
