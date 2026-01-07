-- 연락처 섹션 on/off 제어용 컬럼 추가
-- page_settings.contact: 'on' | 'off'

alter table public.page_settings
  add column if not exists contact text default 'on';

{
  "cells": [],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}