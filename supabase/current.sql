-- List all schemas in the database
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- Output:
| ------------------ |
| auth               |
| extensions         |
| graphql            |
| graphql_public     |
| information_schema |
| pg_catalog         |
| pg_temp_10         |
| pg_temp_11         |
| pg_temp_12         |
| pg_temp_13         |
| pg_temp_14         |
| pg_temp_15         |
| pg_temp_27         |
| pg_temp_28         |
| pg_temp_29         |
| pg_temp_6          |
| pg_temp_7          |
| pg_temp_9          |
| pg_toast           |
| pg_toast_temp_10   |
| pg_toast_temp_11   |
| pg_toast_temp_12   |
| pg_toast_temp_13   |
| pg_toast_temp_14   |
| pg_toast_temp_15   |
| pg_toast_temp_27   |
| pg_toast_temp_28   |
| pg_toast_temp_29   |
| pg_toast_temp_6    |
| pg_toast_temp_7    |
| pg_toast_temp_9    |
| pgbouncer          |
| pgsodium           |
| pgsodium_masks     |
| public             |
| realtime           |
| storage            |
| vault              |

-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- For each table, get its structure
SELECT 
    c.table_name,
    c.column_name, 
    c.data_type,
    c.is_nullable,
    c.column_default
FROM 
    information_schema.columns c
WHERE 
    c.table_schema = 'public'
ORDER BY 
    c.table_name, 
    c.ordinal_position;

-- Output:
| table_name                  | column_name            | data_type                | is_nullable | column_default                |
| --------------------------- | ---------------------- | ------------------------ | ----------- | ----------------------------- |
| active_projects             | id                     | uuid                     | NO          | uuid_generate_v4()            |
| active_projects             | company_name           | text                     | NO          | null                          |
| active_projects             | partner_name           | text                     | NO          | null                          |
| active_projects             | industry               | text                     | NO          | null                          |
| active_projects             | ownership              | integer                  | NO          | null                          |
| active_projects             | development_revenue    | text                     | YES         | null                          |
| active_projects             | additional_revenue     | text                     | YES         | null                          |
| active_projects             | exclusivity            | text                     | YES         | null                          |
| active_projects             | status                 | text                     | YES         | 'Active'::text                |
| active_projects             | user_id                | uuid                     | YES         | null                          |
| active_projects             | created_at             | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| active_projects             | industry_identified    | boolean                  | YES         | false                         |
| active_projects             | partner_ided           | boolean                  | YES         | false                         |
| active_projects             | prototype_created      | boolean                  | YES         | false                         |
| active_projects             | deal_signed            | boolean                  | YES         | false                         |
| active_projects             | website                | text                     | YES         | null                          |
| active_projects             | milestones             | jsonb                    | YES         | '[]'::jsonb                   |
| active_projects             | target_launch_date     | date                     | YES         | null                          |
| active_projects             | priority               | text                     | YES         | 'Medium'::text                |
| active_projects             | team_members           | jsonb                    | YES         | '[]'::jsonb                   |
| active_projects             | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| active_projects             | position               | double precision         | YES         | 0                             |
| brain_dump                  | id                     | uuid                     | NO          | gen_random_uuid()             |
| brain_dump                  | created_at             | timestamp with time zone | NO          | now()                         |
| brain_dump                  | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| brain_dump                  | content                | text                     | YES         | null                          |
| brain_dump                  | name                   | text                     | YES         | null                          |
| brain_dump                  | due_date               | date                     | YES         | null                          |
| brain_dump                  | status                 | USER-DEFINED             | YES         | 'Not Started'::status_type    |
| brain_dump                  | localid                | text                     | YES         | null                          |
| brain_dump                  | summary                | text                     | YES         | null                          |
| brain_dump                  | priority               | USER-DEFINED             | YES         | 'Low'::priority_level         |
| brain_dump                  | category               | USER-DEFINED             | YES         | 'Note'::category_type         |
| brain_dump                  | completed_at           | timestamp with time zone | YES         | null                          |
| brain_dump                  | user_id                | uuid                     | YES         | null                          |
| brain_dump                  | analyzed               | boolean                  | YES         | false                         |
| brain_dump                  | source                 | text                     | YES         | 'brain_dump'::text            |
| company_info                | id                     | uuid                     | NO          | uuid_generate_v4()            |
| company_info                | name                   | text                     | YES         | null                          |
| company_info                | mission                | text                     | YES         | null                          |
| company_info                | vision                 | text                     | YES         | null                          |
| company_info                | values                 | text                     | YES         | null                          |
| company_info                | tech_stack             | text                     | YES         | null                          |
| company_info                | business_context       | text                     | YES         | null                          |
| company_info                | code_context           | text                     | YES         | null                          |
| company_info                | created_at             | timestamp with time zone | YES         | now()                         |
| company_info                | updated_at             | timestamp with time zone | YES         | now()                         |
| company_info                | description            | text                     | YES         | null                          |
| concert_list                | id                     | uuid                     | NO          | uuid_generate_v4()            |
| concert_list                | created_at             | timestamp with time zone | YES         | now()                         |
| concert_list                | name                   | text                     | NO          | null                          |
| concert_list                | artist                 | text                     | YES         | null                          |
| concert_list                | venue                  | text                     | YES         | null                          |
| concert_list                | date                   | date                     | YES         | null                          |
| concert_list                | notes                  | text                     | YES         | null                          |
| concert_list                | status                 | text                     | YES         | 'active'::text                |
| concert_list                | priority               | text                     | YES         | 'medium'::text                |
| concert_list                | original_note_id       | uuid                     | YES         | null                          |
| concert_list                | user_id                | uuid                     | YES         | null                          |
| concert_list                | checked                | boolean                  | YES         | false                         |
| contact_history             | id                     | uuid                     | NO          | uuid_generate_v4()            |
| contact_history             | contact_id             | uuid                     | YES         | null                          |
| contact_history             | interaction_date       | timestamp with time zone | YES         | now()                         |
| contact_history             | interaction_type       | text                     | NO          | null                          |
| contact_history             | notes                  | text                     | YES         | null                          |
| contact_history             | created_at             | timestamp with time zone | YES         | now()                         |
| contact_notes               | id                     | uuid                     | NO          | gen_random_uuid()             |
| contact_notes               | contact_id             | uuid                     | YES         | null                          |
| contact_notes               | user_id                | uuid                     | YES         | null                          |
| contact_notes               | note                   | text                     | NO          | null                          |
| contact_notes               | interaction_date       | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| contact_notes               | created_at             | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| contacts                    | id                     | uuid                     | NO          | gen_random_uuid()             |
| contacts                    | user_id                | uuid                     | YES         | null                          |
| contacts                    | display_name           | text                     | NO          | null                          |
| contacts                    | first_name             | text                     | YES         | null                          |
| contacts                    | last_name              | text                     | YES         | null                          |
| contacts                    | relationship_type      | USER-DEFINED             | YES         | 'other'::relationship_type    |
| contacts                    | mobile_number          | text                     | YES         | null                          |
| contacts                    | email_address          | text                     | YES         | null                          |
| contacts                    | birth_date             | date                     | YES         | null                          |
| contacts                    | is_active              | boolean                  | YES         | true                          |
| contacts                    | last_contact_date      | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| contacts                    | created_at             | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| contacts                    | updated_at             | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| dlltw_chapters              | id                     | uuid                     | NO          | gen_random_uuid()             |
| dlltw_chapters              | user_id                | uuid                     | YES         | null                          |
| dlltw_chapters              | title                  | text                     | NO          | null                          |
| dlltw_chapters              | content                | text                     | YES         | null                          |
| dlltw_chapters              | order_index            | integer                  | NO          | null                          |
| dlltw_chapters              | created_at             | timestamp with time zone | YES         | now()                         |
| dlltw_chapters              | updated_at             | timestamp with time zone | YES         | now()                         |
| dlltw_notes                 | id                     | uuid                     | NO          | gen_random_uuid()             |
| dlltw_notes                 | created_at             | timestamp with time zone | YES         | now()                         |
| dlltw_notes                 | name                   | text                     | NO          | null                          |
| dlltw_notes                 | summary                | text                     | YES         | null                          |
| dlltw_notes                 | content                | text                     | YES         | null                          |
| dlltw_notes                 | status                 | USER-DEFINED             | YES         | 'Not Started'::status_type    |
| dlltw_notes                 | priority               | USER-DEFINED             | YES         | 'Low'::priority_level         |
| dlltw_notes                 | category               | USER-DEFINED             | YES         | 'Note'::category_type         |
| dlltw_notes                 | chapter                | text                     | YES         | null                          |
| dlltw_notes                 | tags                   | ARRAY                    | YES         | null                          |
| dlltw_notes                 | original_note_id       | uuid                     | YES         | null                          |
| dlltw_notes                 | user_id                | text                     | NO          | null                          |
| dlltw_notes                 | chapter_id             | uuid                     | YES         | null                          |
| funding_sources             | id                     | uuid                     | NO          | gen_random_uuid()             |
| funding_sources             | name                   | text                     | NO          | null                          |
| funding_sources             | type                   | USER-DEFINED             | NO          | null                          |
| funding_sources             | amount                 | numeric                  | NO          | null                          |
| funding_sources             | committed_date         | timestamp with time zone | YES         | now()                         |
| funding_sources             | notes                  | text                     | YES         | null                          |
| funding_sources             | created_at             | timestamp with time zone | YES         | now()                         |
| funding_sources             | updated_at             | timestamp with time zone | YES         | now()                         |
| funding_sources             | equity                 | numeric                  | YES         | 0                             |
| goal_milestones             | id                     | uuid                     | NO          | uuid_generate_v4()            |
| goal_milestones             | created_at             | timestamp with time zone | YES         | now()                         |
| goal_milestones             | updated_at             | timestamp with time zone | YES         | now()                         |
| goal_milestones             | goal_id                | uuid                     | NO          | null                          |
| goal_milestones             | description            | text                     | NO          | null                          |
| goal_milestones             | sort_order             | integer                  | YES         | null                          |
| goal_milestones             | completed              | boolean                  | YES         | false                         |
| goal_milestones             | completed_at           | timestamp with time zone | YES         | null                          |
| goal_progress               | id                     | uuid                     | NO          | uuid_generate_v4()            |
| goal_progress               | created_at             | timestamp with time zone | YES         | now()                         |
| goal_progress               | updated_at             | timestamp with time zone | YES         | now()                         |
| goal_progress               | goal_id                | uuid                     | NO          | null                          |
| goal_progress               | value                  | numeric                  | NO          | null                          |
| goal_progress               | note                   | text                     | YES         | null                          |
| goal_progress               | recorded_at            | timestamp with time zone | YES         | now()                         |
| goal_rewards                | id                     | uuid                     | NO          | uuid_generate_v4()            |
| goal_rewards                | created_at             | timestamp with time zone | YES         | now()                         |
| goal_rewards                | updated_at             | timestamp with time zone | YES         | now()                         |
| goal_rewards                | goal_id                | uuid                     | NO          | null                          |
| goal_rewards                | title                  | text                     | NO          | null                          |
| goal_rewards                | description            | text                     | YES         | null                          |
| goal_rewards                | unlocked_at            | timestamp with time zone | YES         | null                          |
| goal_rewards                | claimed_at             | timestamp with time zone | YES         | null                          |
| goal_rewards                | required_progress      | numeric                  | YES         | null                          |
| goals                       | id                     | uuid                     | NO          | uuid_generate_v4()            |
| goals                       | created_at             | timestamp with time zone | YES         | now()                         |
| goals                       | updated_at             | timestamp with time zone | YES         | now()                         |
| goals                       | user_id                | uuid                     | NO          | null                          |
| goals                       | title                  | text                     | NO          | null                          |
| goals                       | description            | text                     | YES         | ''::text                      |
| goals                       | category               | text                     | YES         | 'personal'::text              |
| goals                       | type                   | text                     | YES         | 'milestone'::text             |
| goals                       | priority               | text                     | YES         | 'medium'::text                |
| goals                       | status                 | text                     | YES         | 'active'::text                |
| goals                       | target_date            | timestamp with time zone | YES         | null                          |
| goals                       | target_value           | numeric                  | YES         | null                          |
| goals                       | current_value          | numeric                  | YES         | 0                             |
| goals                       | template_id            | text                     | YES         | null                          |
| goals                       | completed_at           | timestamp with time zone | YES         | null                          |
| goals                       | deadline               | timestamp with time zone | YES         | null                          |
| lists                       | id                     | uuid                     | NO          | gen_random_uuid()             |
| lists                       | created_at             | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| lists                       | name                   | text                     | NO          | null                          |
| lists                       | category               | text                     | NO          | null                          |
| lists                       | description            | text                     | YES         | null                          |
| lists                       | status                 | text                     | YES         | 'active'::text                |
| lists                       | priority               | text                     | YES         | 'medium'::text                |
| lists                       | tags                   | ARRAY                    | YES         | null                          |
| lists                       | metadata               | jsonb                    | YES         | '{}'::jsonb                   |
| mentor_to_launch_projects   | id                     | uuid                     | NO          | uuid_generate_v4()            |
| mentor_to_launch_projects   | company_name           | text                     | YES         | null                          |
| mentor_to_launch_projects   | partner_name           | text                     | YES         | null                          |
| mentor_to_launch_projects   | industry               | text                     | YES         | null                          |
| mentor_to_launch_projects   | ownership              | integer                  | YES         | null                          |
| mentor_to_launch_projects   | development_revenue    | text                     | YES         | null                          |
| mentor_to_launch_projects   | additional_revenue     | text                     | YES         | null                          |
| mentor_to_launch_projects   | exclusivity            | text                     | YES         | null                          |
| mentor_to_launch_projects   | status                 | text                     | YES         | null                          |
| mentor_to_launch_projects   | website                | text                     | YES         | null                          |
| mentor_to_launch_projects   | created_at             | timestamp with time zone | YES         | now()                         |
| mentor_to_launch_projects   | updated_at             | timestamp with time zone | YES         | now()                         |
| mentor_to_launch_projects   | user_id                | uuid                     | YES         | null                          |
| mentor_to_launch_projects   | milestones             | jsonb                    | YES         | '[]'::jsonb                   |
| mentor_to_launch_projects   | target_market          | text                     | YES         | null                          |
| mentor_to_launch_projects   | revenue_model          | text                     | YES         | null                          |
| mentor_to_launch_projects   | launch_status          | text                     | YES         | 'Planning'::text              |
| mentor_to_launch_projects   | business_model         | text                     | YES         | null                          |
| mentor_to_launch_projects   | target_launch_date     | date                     | YES         | null                          |
| mentor_to_launch_projects   | monthly_revenue_goal   | numeric                  | YES         | null                          |
| mentor_to_launch_projects   | marketing_channels     | jsonb                    | YES         | '[]'::jsonb                   |
| mentor_to_launch_projects   | owner_name             | text                     | YES         | null                          |
| mentor_to_launch_projects   | sample_website         | text                     | YES         | null                          |
| mentor_to_launch_projects   | position               | double precision         | YES         | 0                             |
| milestones                  | id                     | uuid                     | NO          | uuid_generate_v4()            |
| milestones                  | project_id             | uuid                     | YES         | null                          |
| milestones                  | title                  | text                     | NO          | null                          |
| milestones                  | description            | text                     | YES         | null                          |
| milestones                  | status                 | text                     | YES         | 'Not Started'::text           |
| milestones                  | due_date               | timestamp with time zone | YES         | null                          |
| milestones                  | priority               | text                     | YES         | 'Medium'::text                |
| milestones                  | user_id                | uuid                     | YES         | null                          |
| milestones                  | created_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| milestones                  | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| module_dependencies         | id                     | uuid                     | NO          | uuid_generate_v4()            |
| module_dependencies         | source_module_id       | uuid                     | YES         | null                          |
| module_dependencies         | target_module_id       | uuid                     | YES         | null                          |
| module_dependencies         | created_at             | timestamp with time zone | YES         | now()                         |
| modules                     | id                     | uuid                     | NO          | uuid_generate_v4()            |
| modules                     | name                   | text                     | NO          | null                          |
| modules                     | type                   | USER-DEFINED             | NO          | null                          |
| modules                     | description            | text                     | YES         | null                          |
| modules                     | ownership_percentage   | integer                  | YES         | 100                           |
| modules                     | monthly_revenue        | numeric                  | YES         | null                          |
| modules                     | platform_id            | uuid                     | YES         | null                          |
| modules                     | created_at             | timestamp with time zone | YES         | now()                         |
| modules                     | updated_at             | timestamp with time zone | YES         | now()                         |
| notes                       | id                     | uuid                     | NO          | uuid_generate_v4()            |
| notes                       | content                | text                     | NO          | null                          |
| notes                       | user_id                | uuid                     | YES         | null                          |
| notes                       | created_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| notes                       | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| organization_employees      | id                     | uuid                     | NO          | uuid_generate_v4()            |
| organization_employees      | name                   | text                     | NO          | null                          |
| organization_employees      | title                  | text                     | NO          | null                          |
| organization_employees      | role                   | text                     | NO          | null                          |
| organization_employees      | status                 | text                     | NO          | null                          |
| organization_employees      | email                  | text                     | YES         | null                          |
| organization_employees      | department             | text                     | YES         | null                          |
| organization_employees      | reports_to             | uuid                     | YES         | null                          |
| organization_employees      | user_id                | uuid                     | YES         | null                          |
| organization_employees      | created_at             | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| organization_employees      | updated_at             | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| organization_positions      | employee_id            | uuid                     | NO          | null                          |
| organization_positions      | x                      | double precision         | NO          | null                          |
| organization_positions      | y                      | double precision         | NO          | null                          |
| organization_positions      | created_at             | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| organization_positions      | updated_at             | timestamp with time zone | YES         | timezone('utc'::text, now())  |
| platform_connections        | id                     | uuid                     | NO          | uuid_generate_v4()            |
| platform_connections        | source_platform_id     | uuid                     | YES         | null                          |
| platform_connections        | target_platform_id     | uuid                     | YES         | null                          |
| platform_connections        | created_at             | timestamp with time zone | YES         | now()                         |
| platforms                   | id                     | uuid                     | NO          | uuid_generate_v4()            |
| platforms                   | name                   | text                     | NO          | null                          |
| platforms                   | type                   | USER-DEFINED             | NO          | null                          |
| platforms                   | description            | text                     | YES         | null                          |
| platforms                   | created_at             | timestamp with time zone | YES         | now()                         |
| platforms                   | updated_at             | timestamp with time zone | YES         | now()                         |
| pro_bono_project_milestones | id                     | uuid                     | NO          | uuid_generate_v4()            |
| pro_bono_project_milestones | project_id             | uuid                     | YES         | null                          |
| pro_bono_project_milestones | title                  | text                     | NO          | null                          |
| pro_bono_project_milestones | description            | text                     | YES         | null                          |
| pro_bono_project_milestones | due_date               | date                     | YES         | null                          |
| pro_bono_project_milestones | status                 | text                     | YES         | 'Not Started'::text           |
| pro_bono_project_milestones | priority               | text                     | YES         | 'Medium'::text                |
| pro_bono_project_milestones | created_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| pro_bono_project_milestones | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| pro_bono_project_milestones | user_id                | uuid                     | YES         | null                          |
| pro_bono_projects           | id                     | uuid                     | NO          | uuid_generate_v4()            |
| pro_bono_projects           | company_name           | text                     | NO          | null                          |
| pro_bono_projects           | partner_name           | text                     | YES         | null                          |
| pro_bono_projects           | industry               | text                     | YES         | null                          |
| pro_bono_projects           | status                 | text                     | YES         | 'Active'::text                |
| pro_bono_projects           | website                | text                     | YES         | null                          |
| pro_bono_projects           | description            | text                     | YES         | null                          |
| pro_bono_projects           | impact_statement       | text                     | YES         | null                          |
| pro_bono_projects           | target_audience        | text                     | YES         | null                          |
| pro_bono_projects           | development_revenue    | text                     | YES         | '$0'::text                    |
| pro_bono_projects           | additional_revenue     | text                     | YES         | '$0'::text                    |
| pro_bono_projects           | created_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| pro_bono_projects           | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| pro_bono_projects           | position               | double precision         | YES         | 0                             |
| pro_bono_projects           | user_id                | uuid                     | YES         | null                          |
| project_milestones          | id                     | uuid                     | NO          | uuid_generate_v4()            |
| project_milestones          | project_id             | uuid                     | NO          | null                          |
| project_milestones          | milestone_type         | text                     | NO          | null                          |
| project_milestones          | completed              | boolean                  | YES         | false                         |
| project_milestones          | completed_at           | timestamp with time zone | YES         | null                          |
| project_milestones          | created_at             | timestamp with time zone | YES         | now()                         |
| project_milestones          | updated_at             | timestamp with time zone | YES         | now()                         |
| project_notes               | id                     | uuid                     | NO          | uuid_generate_v4()            |
| project_notes               | project_id             | uuid                     | YES         | null                          |
| project_notes               | note_id                | uuid                     | YES         | null                          |
| project_notes               | user_id                | uuid                     | YES         | null                          |
| project_notes               | created_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| project_notes               | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| projects_list               | id                     | uuid                     | NO          | uuid_generate_v4()            |
| projects_list               | created_at             | timestamp with time zone | YES         | now()                         |
| projects_list               | name                   | text                     | NO          | null                          |
| projects_list               | description            | text                     | YES         | null                          |
| projects_list               | deadline               | date                     | YES         | null                          |
| projects_list               | status                 | text                     | YES         | 'active'::text                |
| projects_list               | priority               | text                     | YES         | 'medium'::text                |
| projects_list               | original_note_id       | uuid                     | YES         | null                          |
| projects_list               | user_id                | uuid                     | YES         | null                          |
| projects_list               | checked                | boolean                  | YES         | false                         |
| public_notes                | id                     | uuid                     | NO          | uuid_generate_v4()            |
| public_notes                | content                | text                     | NO          | null                          |
| public_notes                | created_at             | timestamp with time zone | NO          | timezone('utc'::text, now())  |
| public_notes                | analyzed               | boolean                  | YES         | false                         |
| public_notes                | audio_url              | text                     | YES         | null                          |
| public_notes                | source_type            | text                     | NO          | 'text'::text                  |
| public_notes                | device_info            | jsonb                    | YES         | '{}'::jsonb                   |
| public_notes                | transcription_provider | text                     | YES         | null                          |
| public_notes                | status                 | text                     | YES         | null                          |
| public_notes                | priority               | text                     | YES         | null                          |
| public_notes                | category               | text                     | YES         | null                          |
| public_notes                | summary                | text                     | YES         | null                          |
| restaurant_list             | id                     | uuid                     | NO          | uuid_generate_v4()            |
| restaurant_list             | created_at             | timestamp with time zone | YES         | now()                         |
| restaurant_list             | name                   | text                     | NO          | null                          |
| restaurant_list             | cuisine                | text                     | YES         | null                          |
| restaurant_list             | location               | text                     | YES         | null                          |
| restaurant_list             | notes                  | text                     | YES         | null                          |
| restaurant_list             | status                 | text                     | YES         | 'active'::text                |
| restaurant_list             | priority               | text                     | YES         | 'medium'::text                |
| restaurant_list             | original_note_id       | uuid                     | YES         | null                          |
| restaurant_list             | user_id                | uuid                     | YES         | null                          |
| restaurant_list             | checked                | boolean                  | YES         | false                         |
| shopping_list               | id                     | uuid                     | NO          | gen_random_uuid()             |
| shopping_list               | created_at             | timestamp with time zone | YES         | now()                         |
| shopping_list               | name                   | text                     | NO          | null                          |
| shopping_list               | summary                | text                     | YES         | null                          |
| shopping_list               | status                 | USER-DEFINED             | YES         | 'Not Started'::status_type    |
| shopping_list               | priority               | USER-DEFINED             | YES         | 'Low'::priority_level         |
| shopping_list               | quantity               | integer                  | YES         | 1                             |
| shopping_list               | original_note_id       | uuid                     | YES         | null                          |
| shopping_list               | user_id                | text                     | YES         | null                          |
| shopping_list               | checked                | boolean                  | YES         | false                         |
| shopping_list               | description            | text                     | YES         | null                          |
| static_website_projects     | id                     | uuid                     | NO          | uuid_generate_v4()            |
| static_website_projects     | company_name           | text                     | YES         | null                          |
| static_website_projects     | partner_name           | text                     | YES         | null                          |
| static_website_projects     | industry               | text                     | YES         | null                          |
| static_website_projects     | ownership              | integer                  | YES         | null                          |
| static_website_projects     | development_revenue    | text                     | YES         | null                          |
| static_website_projects     | additional_revenue     | text                     | YES         | null                          |
| static_website_projects     | exclusivity            | text                     | YES         | null                          |
| static_website_projects     | status                 | text                     | YES         | null                          |
| static_website_projects     | website                | text                     | YES         | null                          |
| static_website_projects     | created_at             | timestamp with time zone | YES         | now()                         |
| static_website_projects     | updated_at             | timestamp with time zone | YES         | now()                         |
| static_website_projects     | user_id                | uuid                     | YES         | null                          |
| static_website_projects     | hosting_provider       | text                     | YES         | null                          |
| static_website_projects     | domain_provider        | text                     | YES         | null                          |
| static_website_projects     | monthly_cost           | numeric                  | YES         | null                          |
| static_website_projects     | design_notes           | text                     | YES         | null                          |
| static_website_projects     | maintenance_notes      | text                     | YES         | null                          |
| structure_lines             | id                     | uuid                     | NO          | null                          |
| structure_lines             | x1                     | double precision         | NO          | null                          |
| structure_lines             | y1                     | double precision         | NO          | null                          |
| structure_lines             | x2                     | double precision         | NO          | null                          |
| structure_lines             | y2                     | double precision         | NO          | null                          |
| structure_lines             | is_dashed              | boolean                  | YES         | false                         |
| structure_lines             | color                  | character varying        | YES         | '#000000'::character varying  |
| structure_lines             | created_at             | timestamp with time zone | NO          | now()                         |
| structure_lines             | updated_at             | timestamp with time zone | NO          | now()                         |
| structure_node_positions    | id                     | uuid                     | NO          | uuid_generate_v4()            |
| structure_node_positions    | node_id                | text                     | NO          | null                          |
| structure_node_positions    | x                      | double precision         | NO          | null                          |
| structure_node_positions    | y                      | double precision         | NO          | null                          |
| structure_node_positions    | scale                  | double precision         | YES         | 1                             |
| structure_node_positions    | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| structure_node_positions    | width                  | integer                  | YES         | 220                           |
| structure_node_positions    | height                 | integer                  | YES         | 100                           |
| structure_nodes             | id                     | text                     | NO          | null                          |
| structure_nodes             | name                   | text                     | NO          | null                          |
| structure_nodes             | description            | text                     | YES         | null                          |
| structure_nodes             | connections            | ARRAY                    | YES         | '{}'::text[]                  |
| structure_nodes             | platform               | text                     | YES         | null                          |
| structure_nodes             | ownership              | integer                  | YES         | null                          |
| structure_nodes             | monthly_revenue        | numeric                  | YES         | null                          |
| structure_nodes             | user_id                | text                     | NO          | 'public'::text                |
| structure_nodes             | created_at             | timestamp with time zone | YES         | now()                         |
| structure_nodes             | updated_at             | timestamp with time zone | YES         | CURRENT_TIMESTAMP             |
| structure_nodes             | type                   | USER-DEFINED             | NO          | 'module'::structure_node_type |
| team_meeting_participants   | id                     | uuid                     | NO          | gen_random_uuid()             |
| team_meeting_participants   | meeting_id             | uuid                     | YES         | null                          |
| team_meeting_participants   | employee_id            | uuid                     | YES         | null                          |
| team_meeting_participants   | objectives             | text                     | YES         | null                          |
| team_meeting_participants   | conclusions            | text                     | YES         | null                          |
| team_meeting_participants   | created_at             | timestamp with time zone | YES         | now()                         |
| team_meeting_participants   | updated_at             | timestamp with time zone | YES         | now()                         |
| team_meeting_participants   | user_id                | uuid                     | YES         | auth.uid()                    |
| team_meetings               | id                     | uuid                     | NO          | gen_random_uuid()             |
| team_meetings               | title                  | text                     | NO          | null                          |
| team_meetings               | description            | text                     | YES         | null                          |
| team_meetings               | meeting_date           | timestamp with time zone | NO          | null                          |
| team_meetings               | status                 | text                     | NO          | null                          |
| team_meetings               | pre_meeting_summary    | text                     | YES         | null                          |
| team_meetings               | post_meeting_summary   | text                     | YES         | null                          |
| team_meetings               | created_at             | timestamp with time zone | YES         | now()                         |
| team_meetings               | updated_at             | timestamp with time zone | YES         | now()                         |
| team_meetings               | user_id                | uuid                     | YES         | auth.uid()                    |
| team_meetings               | transcript             | text                     | YES         | null                          |
| team_meetings               | completed_at           | timestamp with time zone | YES         | null                          |

-- List auth-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Output:
| table_name        |
| ----------------- |
| audit_log_entries |
| flow_state        |
| identities        |
| instances         |
| mfa_amr_claims    |
| mfa_challenges    |
| mfa_factors       |
| one_time_tokens   |
| refresh_tokens    |
| saml_providers    |
| saml_relay_states |
| schema_migrations |
| sessions          |
| sso_domains       |
| sso_providers     |
| users             |

-- Check which tables have RLS enabled
SELECT
    n.nspname as schema,
    c.relname as table,
    CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END as rls
FROM
    pg_class c
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    c.relkind = 'r' AND
    n.nspname = 'public'
ORDER BY
    n.nspname, c.relname;

-- Output:
| schema | table                       | rls      |
| ------ | --------------------------- | -------- |
| public | active_projects             | enabled  |
| public | brain_dump                  | enabled  |
| public | company_info                | enabled  |
| public | concert_list                | enabled  |
| public | contact_history             | enabled  |
| public | contact_notes               | enabled  |
| public | contacts                    | enabled  |
| public | dlltw_chapters              | enabled  |
| public | dlltw_notes                 | enabled  |
| public | funding_sources             | enabled  |
| public | goal_milestones             | enabled  |
| public | goal_progress               | enabled  |
| public | goal_rewards                | enabled  |
| public | goals                       | enabled  |
| public | lists                       | disabled |
| public | mentor_to_launch_projects   | enabled  |
| public | milestones                  | enabled  |
| public | module_dependencies         | disabled |
| public | modules                     | disabled |
| public | notes                       | enabled  |
| public | organization_employees      | disabled |
| public | organization_positions      | disabled |
| public | platform_connections        | disabled |
| public | platforms                   | disabled |
| public | pro_bono_project_milestones | disabled |
| public | pro_bono_projects           | disabled |
| public | project_milestones          | enabled  |
| public | project_notes               | enabled  |
| public | projects_list               | enabled  |
| public | public_notes                | enabled  |
| public | restaurant_list             | enabled  |
| public | shopping_list               | enabled  |
| public | static_website_projects     | enabled  |
| public | structure_lines             | enabled  |
| public | structure_node_positions    | disabled |
| public | structure_nodes             | disabled |
| public | team_meeting_participants   | enabled  |
| public | team_meetings               | enabled  |

-- List all RLS policies
SELECT
    n.nspname as schema,
    c.relname as table,
    pol.polname as policy_name,
    CASE 
        WHEN pol.polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type,
    CASE 
        WHEN pol.polcmd = 'r' THEN 'SELECT'
        WHEN pol.polcmd = 'a' THEN 'INSERT'
        WHEN pol.polcmd = 'w' THEN 'UPDATE'
        WHEN pol.polcmd = 'd' THEN 'DELETE'
        WHEN pol.polcmd = '*' THEN 'ALL'
    END as command,
    pg_get_expr(pol.polqual, pol.polrelid) as expression
FROM
    pg_policy pol
JOIN
    pg_class c ON c.oid = pol.polrelid
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
ORDER BY
    n.nspname, c.relname, pol.polname;

-- Output:
| schema | table                     | policy_name                                           | policy_type | command | expression                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------- | ----------------------------------------------------- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public | active_projects           | Enable delete access for authenticated users          | PERMISSIVE  | DELETE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | active_projects           | Enable insert access for authenticated users          | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | active_projects           | Enable read access for authenticated users            | PERMISSIVE  | SELECT  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | active_projects           | Enable update access for authenticated users          | PERMISSIVE  | UPDATE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | brain_dump                | Anyone can create notes from main page                | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | brain_dump                | Authenticated users can view all notes in brain inbox | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | brain_dump                | Only owner can delete notes                           | PERMISSIVE  | DELETE  | ((auth.uid())::text = '59600766-c06b-4881-8dba-9015c4e67a01'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public | brain_dump                | Only owner can update notes                           | PERMISSIVE  | UPDATE  | ((auth.uid())::text = '59600766-c06b-4881-8dba-9015c4e67a01'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public | company_info              | Allow authenticated insert                            | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | company_info              | Allow authenticated read                              | PERMISSIVE  | SELECT  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | company_info              | Allow authenticated update                            | PERMISSIVE  | UPDATE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | concert_list              | Users can delete their own concert items              | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | concert_list              | Users can insert their own concert items              | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | concert_list              | Users can update their own concert items              | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | concert_list              | Users can view their own concert items                | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contact_history           | Users can insert history for their own contacts       | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | contact_history           | Users can view their own contacts' history            | PERMISSIVE  | SELECT  | (contact_id IN ( SELECT contacts.id
   FROM contacts
  WHERE (contacts.user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| public | contact_notes             | Users can delete their own contact notes              | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contact_notes             | Users can insert their own contact notes              | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | contact_notes             | Users can update their own contact notes              | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contact_notes             | Users can view their own contact notes                | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contacts                  | Users can delete their own contacts                   | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contacts                  | Users can insert their own contacts                   | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | contacts                  | Users can update their own contacts                   | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | contacts                  | Users can view their own contacts                     | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | dlltw_chapters            | Users can delete their own chapters                   | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | dlltw_chapters            | Users can insert their own chapters                   | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | dlltw_chapters            | Users can update their own chapters                   | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | dlltw_chapters            | Users can view their own chapters                     | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | dlltw_notes               | Enable view/update/delete for authenticated users     | PERMISSIVE  | ALL     | ((auth.uid())::text = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| public | funding_sources           | Enable insert access for authenticated users          | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | funding_sources           | Enable read access for authenticated users            | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | funding_sources           | Enable update access for authenticated users          | PERMISSIVE  | UPDATE  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | goal_milestones           | Enable delete access for own goal milestones          | PERMISSIVE  | DELETE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_milestones.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public | goal_milestones           | Enable insert access for own goal milestones          | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | goal_milestones           | Enable read access for own goal milestones            | PERMISSIVE  | SELECT  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_milestones.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public | goal_milestones           | Enable update access for own goal milestones          | PERMISSIVE  | UPDATE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_milestones.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public | goal_progress             | Enable delete access for own goal progress            | PERMISSIVE  | DELETE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_progress.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | goal_progress             | Enable insert access for own goal progress            | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | goal_progress             | Enable read access for own goal progress              | PERMISSIVE  | SELECT  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_progress.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | goal_progress             | Enable update access for own goal progress            | PERMISSIVE  | UPDATE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_progress.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | goal_rewards              | Enable delete access for own goal rewards             | PERMISSIVE  | DELETE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_rewards.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | goal_rewards              | Enable insert access for own goal rewards             | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | goal_rewards              | Enable read access for own goal rewards               | PERMISSIVE  | SELECT  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_rewards.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | goal_rewards              | Enable update access for own goal rewards             | PERMISSIVE  | UPDATE  | (EXISTS ( SELECT 1
   FROM goals
  WHERE ((goals.id = goal_rewards.goal_id) AND (goals.user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | goals                     | Enable delete access for own goals                    | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | goals                     | Enable insert access for own goals                    | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | goals                     | Enable read access for own goals                      | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | goals                     | Enable update access for own goals                    | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | mentor_to_launch_projects | Users can delete their own mentor to launch projects  | PERMISSIVE  | DELETE  | ((user_id)::text = (auth.uid())::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | mentor_to_launch_projects | Users can insert their own mentor to launch projects  | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | mentor_to_launch_projects | Users can update their own mentor to launch projects  | PERMISSIVE  | UPDATE  | ((user_id)::text = (auth.uid())::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | mentor_to_launch_projects | Users can view their own mentor to launch projects    | PERMISSIVE  | SELECT  | ((user_id)::text = (auth.uid())::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | milestones                | Users can delete project milestones                   | PERMISSIVE  | DELETE  | ((auth.uid() = user_id) OR (auth.uid() IN ( SELECT active_projects.user_id
   FROM active_projects
  WHERE (active_projects.id = milestones.project_id)
UNION
 SELECT mentor_to_launch_projects.user_id
   FROM mentor_to_launch_projects
  WHERE (mentor_to_launch_projects.id = milestones.project_id))))                                                                                                                                                                                                                        |
| public | milestones                | Users can insert project milestones                   | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | milestones                | Users can update project milestones                   | PERMISSIVE  | UPDATE  | ((auth.uid() = user_id) OR (auth.uid() IN ( SELECT active_projects.user_id
   FROM active_projects
  WHERE (active_projects.id = milestones.project_id)
UNION
 SELECT mentor_to_launch_projects.user_id
   FROM mentor_to_launch_projects
  WHERE (mentor_to_launch_projects.id = milestones.project_id))))                                                                                                                                                                                                                        |
| public | milestones                | Users can view project milestones                     | PERMISSIVE  | SELECT  | ((auth.uid() = user_id) OR (auth.uid() IN ( SELECT active_projects.user_id
   FROM active_projects
  WHERE (active_projects.id = milestones.project_id)
UNION
 SELECT mentor_to_launch_projects.user_id
   FROM mentor_to_launch_projects
  WHERE (mentor_to_launch_projects.id = milestones.project_id))))                                                                                                                                                                                                                        |
| public | notes                     | Users can delete their own notes                      | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | notes                     | Users can insert their own notes                      | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | notes                     | Users can update their own notes                      | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | notes                     | Users can view their own notes                        | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | project_milestones        | Enable read access for own project milestones         | PERMISSIVE  | SELECT  | ((EXISTS ( SELECT 1
   FROM active_projects
  WHERE ((active_projects.id = project_milestones.project_id) AND (active_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM static_website_projects
  WHERE ((static_website_projects.id = project_milestones.project_id) AND (static_website_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM mentor_to_launch_projects
  WHERE ((mentor_to_launch_projects.id = project_milestones.project_id) AND (mentor_to_launch_projects.user_id = auth.uid()))))) |
| public | project_milestones        | Enable update access for own project milestones       | PERMISSIVE  | UPDATE  | ((EXISTS ( SELECT 1
   FROM active_projects
  WHERE ((active_projects.id = project_milestones.project_id) AND (active_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM static_website_projects
  WHERE ((static_website_projects.id = project_milestones.project_id) AND (static_website_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM mentor_to_launch_projects
  WHERE ((mentor_to_launch_projects.id = project_milestones.project_id) AND (mentor_to_launch_projects.user_id = auth.uid()))))) |
| public | project_notes             | Users can delete project notes                        | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | project_notes             | Users can insert project notes                        | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | project_notes             | Users can view project notes                          | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | projects_list             | Users can delete their own project items              | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | projects_list             | Users can insert their own project items              | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | projects_list             | Users can update their own project items              | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | projects_list             | Users can view their own project items                | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | public_notes              | Allow authenticated users full access                 | PERMISSIVE  | ALL     | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | public_notes              | Allow public inserts                                  | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | public_notes              | Anyone can insert public notes                        | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | public_notes              | Anyone can view public notes                          | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | restaurant_list           | Users can delete their own restaurant items           | PERMISSIVE  | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | restaurant_list           | Users can insert their own restaurant items           | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | restaurant_list           | Users can update their own restaurant items           | PERMISSIVE  | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | restaurant_list           | Users can view their own restaurant items             | PERMISSIVE  | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | shopping_list             | Enable delete access for authenticated users          | PERMISSIVE  | DELETE  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | shopping_list             | Enable insert access for authenticated users          | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | shopping_list             | Enable read access for authenticated users            | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | shopping_list             | Enable update access for authenticated users          | PERMISSIVE  | UPDATE  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | shopping_list             | Enable view/update/delete for authenticated users     | PERMISSIVE  | ALL     | (auth.uid() IS NOT NULL)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | static_website_projects   | Users can delete their own static website projects    | PERMISSIVE  | DELETE  | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | static_website_projects   | Users can insert their own static website projects    | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | static_website_projects   | Users can update their own static website projects    | PERMISSIVE  | UPDATE  | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | static_website_projects   | Users can view their own static website projects      | PERMISSIVE  | SELECT  | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | structure_lines           | Enable delete for authenticated users only            | PERMISSIVE  | DELETE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | structure_lines           | Enable insert for authenticated users only            | PERMISSIVE  | INSERT  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | structure_lines           | Enable read access for all users                      | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | structure_lines           | Enable update for authenticated users only            | PERMISSIVE  | UPDATE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | structure_node_positions  | Enable update for authenticated users only            | PERMISSIVE  | UPDATE  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | team_meeting_participants | Allow full access to owner                            | PERMISSIVE  | ALL     | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | team_meeting_participants | Allow read access for authenticated users             | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | team_meetings             | Allow full access to owner                            | PERMISSIVE  | ALL     | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | team_meetings             | Allow read access for authenticated users             | PERMISSIVE  | SELECT  | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

***
-- List all roles
SELECT
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM
    pg_roles
ORDER BY
    rolname;

-- Check User-Specific Data Columns
SELECT 
    table_name, 
    column_name
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    column_name IN ('user_id', 'auth_id', 'owner_id', 'user_uuid')
ORDER BY 
    table_name;

--  Output:
| column_name  | data_type                | is_nullable | column_default             |
| ------------ | ------------------------ | ----------- | -------------------------- |
| id           | uuid                     | NO          | gen_random_uuid()          |
| created_at   | timestamp with time zone | NO          | now()                      |
| updated_at   | timestamp with time zone | YES         | CURRENT_TIMESTAMP          |
| content      | text                     | YES         | null                       |
| name         | text                     | YES         | null                       |
| due_date     | date                     | YES         | null                       |
| status       | USER-DEFINED             | YES         | 'Not Started'::status_type |
| localid      | text                     | YES         | null                       |
| summary      | text                     | YES         | null                       |
| priority     | USER-DEFINED             | YES         | 'Low'::priority_level      |
| category     | USER-DEFINED             | YES         | 'Note'::category_type      |
| completed_at | timestamp with time zone | YES         | null                       |
| user_id      | uuid                     | YES         | null                       |
| analyzed     | boolean                  | YES         | false                      |
| source       | text                     | YES         | 'brain_dump'::text         |

-- Check Foreign Keys and Relationships
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
JOIN 
    information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN 
    information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' AND
    tc.table_schema = 'public'
ORDER BY 
    tc.table_name;

-- Output:
| column_name  | data_type                | is_nullable | column_default             |
| ------------ | ------------------------ | ----------- | -------------------------- |
| id           | uuid                     | NO          | gen_random_uuid()          |
| created_at   | timestamp with time zone | NO          | now()                      |
| updated_at   | timestamp with time zone | YES         | CURRENT_TIMESTAMP          |
| content      | text                     | YES         | null                       |
| name         | text                     | YES         | null                       |
| due_date     | date                     | YES         | null                       |
| status       | USER-DEFINED             | YES         | 'Not Started'::status_type |
| localid      | text                     | YES         | null                       |
| summary      | text                     | YES         | null                       |
| priority     | USER-DEFINED             | YES         | 'Low'::priority_level      |
| category     | USER-DEFINED             | YES         | 'Note'::category_type      |
| completed_at | timestamp with time zone | YES         | null                       |
| user_id      | uuid                     | YES         | null                       |
| analyzed     | boolean                  | YES         | false                      |
| source       | text                     | YES         | 'brain_dump'::text         |

-- Check the structure of the brain_dump table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    table_name = 'brain_dump'
ORDER BY 
    ordinal_position;

-- Output:
| column_name  | data_type                | is_nullable | column_default             |
| ------------ | ------------------------ | ----------- | -------------------------- |
| id           | uuid                     | NO          | gen_random_uuid()          |
| created_at   | timestamp with time zone | NO          | now()                      |
| updated_at   | timestamp with time zone | YES         | CURRENT_TIMESTAMP          |
| content      | text                     | YES         | null                       |
| name         | text                     | YES         | null                       |
| due_date     | date                     | YES         | null                       |
| status       | USER-DEFINED             | YES         | 'Not Started'::status_type |
| localid      | text                     | YES         | null                       |
| summary      | text                     | YES         | null                       |
| priority     | USER-DEFINED             | YES         | 'Low'::priority_level      |
| category     | USER-DEFINED             | YES         | 'Note'::category_type      |
| completed_at | timestamp with time zone | YES         | null                       |
| user_id      | uuid                     | YES         | null                       |
| analyzed     | boolean                  | YES         | false                      |
| source       | text                     | YES         | 'brain_dump'::text         |