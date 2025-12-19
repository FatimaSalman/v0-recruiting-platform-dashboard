-- Add to existing scripts or create a new one: 007_handle_free_trial.sql

-- Function to check if user can create jobs/candidates based on subscription
CREATE OR REPLACE FUNCTION check_user_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_subscription record;
    job_count integer;
    candidate_count integer;
BEGIN
    -- Get user's subscription
    SELECT * INTO user_subscription FROM subscriptions WHERE user_id = NEW.user_id;
    
    -- If no subscription, allow creation (they're on free trial)
    IF user_subscription IS NULL THEN
        -- Count user's current jobs
        SELECT COUNT(*) INTO job_count FROM jobs WHERE user_id = NEW.user_id;
        IF TG_TABLE_NAME = 'jobs' AND job_count >= 5 THEN
            RAISE EXCEPTION 'Free trial limit: Maximum 5 jobs allowed';
        END IF;
        
        -- Count user's current candidates
        SELECT COUNT(*) INTO candidate_count FROM candidates WHERE user_id = NEW.user_id;
        IF TG_TABLE_NAME = 'candidates' AND candidate_count >= 10 THEN
            RAISE EXCEPTION 'Free trial limit: Maximum 10 candidates allowed';
        END IF;
    ELSIF user_subscription.plan_id = 'free-trial' THEN
        -- Check trial limits
        SELECT COUNT(*) INTO job_count FROM jobs WHERE user_id = NEW.user_id;
        IF TG_TABLE_NAME = 'jobs' AND job_count >= 5 THEN
            RAISE EXCEPTION 'Free trial limit: Maximum 5 jobs allowed';
        END IF;
        
        SELECT COUNT(*) INTO candidate_count FROM candidates WHERE user_id = NEW.user_id;
        IF TG_TABLE_NAME = 'candidates' AND candidate_count >= 10 THEN
            RAISE EXCEPTION 'Free trial limit: Maximum 10 candidates allowed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for jobs and candidates tables
DROP TRIGGER IF EXISTS check_job_limits ON jobs;
CREATE TRIGGER check_job_limits
    BEFORE INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION check_user_limits();

DROP TRIGGER IF EXISTS check_candidate_limits ON candidates;
CREATE TRIGGER check_candidate_limits
    BEFORE INSERT ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION check_user_limits();