-- RSVP 활성화 컬럼 추가
ALTER TABLE public.page_settings
ADD COLUMN rsvp text DEFAULT 'off' CHECK (rsvp IN ('on', 'off'));

-- 기본값을 'off'로 설정
UPDATE public.page_settings SET rsvp = 'off' WHERE rsvp IS NULL;

-- 인덱스 추가 (선택사항)
CREATE INDEX idx_page_settings_rsvp ON public.page_settings(rsvp);
