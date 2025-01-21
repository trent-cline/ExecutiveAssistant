-- Insert sample goals
INSERT INTO goals (title, description, category, priority, status, target_date, target_value, current_value, user_id)
VALUES
    -- Weight Gain Goal
    ('Reach 180 Pounds', 
    'Get to a healthy weight of 180 pounds through consistent exercise and healthy eating habits', 
    'health', 
    'high', 
    'active',
    '2025-12-31',
    180,
    155,
    auth.uid()),

    -- Reading Goal
    ('Read 12 Books in 2025', 
    'Read one book per month to expand knowledge and maintain a consistent reading habit', 
    'personal', 
    'medium', 
    'active',
    '2025-12-31',
    12,
    0,
    auth.uid()),

    -- Business Goal
    ('Launch Successful Business', 
    'Create and grow a profitable business venture from ground up', 
    'business', 
    'high', 
    'active',
    '2026-01-15',
    NULL,
    NULL,
    auth.uid());

-- Insert milestones for weight loss goal
INSERT INTO goal_milestones (goal_id, description, sort_order, completed)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'Set up gym membership and workout schedule',
        'Create meal planning system',
        'Reach 190 pounds',
        'Reach 185 pounds',
        'Maintain weight for one month',
        'Reach final goal of 180 pounds'
    ]) as description,
    generate_series(0, 5) as sort_order,
    false as completed
FROM goals
WHERE title = 'Reach 180 Pounds';

-- Insert milestones for reading goal
INSERT INTO goal_milestones (goal_id, description, sort_order, completed)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'Create reading list for the year',
        'Set up Goodreads account for tracking',
        'Complete Q1 reading (3 books)',
        'Complete Q2 reading (6 books)',
        'Complete Q3 reading (9 books)',
        'Complete all 12 books'
    ]) as description,
    generate_series(0, 5) as sort_order,
    false as completed
FROM goals
WHERE title = 'Read 12 Books in 2025';

-- Insert milestones for business goal
INSERT INTO goal_milestones (goal_id, description, sort_order, completed)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'Complete market research and business plan',
        'Develop MVP (Minimum Viable Product)',
        'Secure initial funding/investment',
        'Launch product/service',
        'Achieve first 100 customers',
        'Reach break-even point'
    ]) as description,
    generate_series(0, 5) as sort_order,
    false as completed
FROM goals
WHERE title = 'Launch Successful Business';

-- Insert rewards for weight loss goal
INSERT INTO goal_rewards (goal_id, title, description, required_progress)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'New Workout Gear',
        'Spa Day',
        'Complete Wardrobe Refresh'
    ]) as title,
    unnest(ARRAY[
        'Buy new workout clothes after reaching 180 pounds',
        'Treat yourself to a spa day at 170 pounds',
        'Buy a new wardrobe when reaching final goal'
    ]) as description,
    unnest(ARRAY[160, 170, 180]) as required_progress
FROM goals
WHERE title = 'Reach 180 Pounds';

-- Insert rewards for reading goal
INSERT INTO goal_rewards (goal_id, title, description, required_progress)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'New E-Reader',
        'Book Shopping Spree',
        'Literary Vacation'
    ]) as title,
    unnest(ARRAY[
        'Get a new Kindle after completing 3 books',
        'Book shopping spree after 6 books',
        'Take a trip to famous literary location after completing challenge'
    ]) as description,
    unnest(ARRAY[3, 6, 12]) as required_progress
FROM goals
WHERE title = 'Read 12 Books in 2025';

-- Insert rewards for business goal
INSERT INTO goal_rewards (goal_id, title, description, required_progress)
SELECT 
    id as goal_id,
    unnest(ARRAY[
        'Office Setup',
        'Business Coach',
        'Team Celebration'
    ]) as title,
    unnest(ARRAY[
        'Set up proper home office after completing business plan',
        'Hire a business coach after launching',
        'Team celebration dinner after reaching break-even'
    ]) as description,
    unnest(ARRAY[1, 50, 100]) as required_progress
FROM goals
WHERE title = 'Launch Successful Business';

-- Insert initial progress for weight loss
INSERT INTO goal_progress (goal_id, value, note, recorded_at)
SELECT 
    id as goal_id,
    195 as value,
    'Initial weight measurement' as note,
    NOW() as recorded_at
FROM goals
WHERE title = 'Reach 180 Pounds';
