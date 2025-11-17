-- tasks 테이블에 priority와 completed_at 컬럼 추가

-- priority 컬럼 추가 (high, medium, low)
ALTER TABLE public.tasks 
ADD COLUMN priority varchar(10) DEFAULT 'medium'::character varying;

-- completed_at 컬럼 추가 (Task가 완료된 날짜)
ALTER TABLE public.tasks 
ADD COLUMN completed_at timestamp NULL;

-- priority 컬럼에 인덱스 추가
CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);

-- completed_at 컬럼에 인덱스 추가
CREATE INDEX idx_tasks_completed_at ON public.tasks USING btree (completed_at);

-- 기존 완료된 Task들에 completed_at 설정 (updated_at 기준)
UPDATE public.tasks 
SET completed_at = updated_at 
WHERE status = '완료' AND completed_at IS NULL;
