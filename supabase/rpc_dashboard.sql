CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID, p_days INT DEFAULT 28)
RETURNS JSON AS $$
DECLARE
  v_end_date DATE := CURRENT_DATE;
  v_start_date DATE := v_end_date - p_days + 1;
  
  v_total_completed_workouts INT;
  v_active_time_seconds INT;
  v_weekly_volume JSON;
  v_heatmap JSON;
BEGIN

  -- 1. Workouts completed
  SELECT count(*) INTO v_total_completed_workouts
  FROM sessions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND session_date >= v_start_date
    AND session_date <= v_end_date;
  
  -- 2. Active time
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0)::INT 
  INTO v_active_time_seconds
  FROM sessions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND session_date >= v_start_date;
    
  -- 3. Weekly Volume (last 4 weeks).
  WITH SessionVols AS (
    SELECT s.session_date, ss.weight * ss.reps as vol
    FROM sessions s
    JOIN session_exercises se ON s.id = se.session_id
    JOIN session_sets ss ON se.id = ss.session_exercise_id
    WHERE s.user_id = p_user_id
      AND s.status = 'completed'
      AND s.session_date >= (CURRENT_DATE - 27)
      AND ss.is_warmup = false
      AND ss.weight IS NOT NULL
      AND ss.reps IS NOT NULL
  ),
  WeeklyVols AS (
    SELECT 
      CASE 
        WHEN session_date >= (CURRENT_DATE - 6) THEN 'W4'
        WHEN session_date >= (CURRENT_DATE - 13) THEN 'W3'
        WHEN session_date >= (CURRENT_DATE - 20) THEN 'W2'
        ELSE 'W1'
      END as week_label,
      SUM(vol) as total_vol
    FROM SessionVols
    GROUP BY week_label
  )
  SELECT json_agg(json_build_object('label', w.lbl, 'value', COALESCE(wv.total_vol, 0)))
  INTO v_weekly_volume
  FROM (VALUES ('W1'), ('W2'), ('W3'), ('W4')) as w(lbl)
  LEFT JOIN WeeklyVols wv ON wv.week_label = w.lbl;

  -- 4. Heatmap (last 28 days = exactly 4 weeks).
  WITH DailyVols AS (
    SELECT s.session_date, SUM(ss.weight * ss.reps) as vol
    FROM sessions s
    JOIN session_exercises se ON s.id = se.session_id
    JOIN session_sets ss ON se.id = ss.session_exercise_id
    WHERE s.user_id = p_user_id
      AND s.status = 'completed'
      AND s.session_date >= (CURRENT_DATE - 27)
    GROUP BY s.session_date
  ),
  DateSeries AS (
    SELECT (CURRENT_DATE - (27 - d))::DATE as dte
    FROM generate_series(0, 27) d
  ),
  HeatmapData AS (
    SELECT 
      ds.dte,
      CASE 
        WHEN ds.dte > CURRENT_DATE THEN -1
        WHEN dv.vol IS NULL THEN -1
        WHEN dv.vol < 1000 THEN 1
        WHEN dv.vol < 3000 THEN 2
        WHEN dv.vol < 6000 THEN 3
        ELSE 4
      END as lvl
    FROM DateSeries ds
    LEFT JOIN DailyVols dv ON ds.dte = dv.session_date
    ORDER BY ds.dte
  )
  SELECT json_agg(lvl) INTO v_heatmap FROM HeatmapData;
  
  RETURN json_build_object(
    'workouts', json_build_object('completed', v_total_completed_workouts, 'total', 16),
    'activeTimeSeconds', v_active_time_seconds,
    'weeklyVolume', v_weekly_volume,
    'heatmap', v_heatmap
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
