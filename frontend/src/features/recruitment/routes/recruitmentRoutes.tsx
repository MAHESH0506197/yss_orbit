// yss_orbit\frontend\src\modules\recruitment\routes\recruitmentRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { RecruitmentListPage } from '../pages/recruitmentListPage';
// @ts-expect-error - Auto-patched TS2307
import { JobPostingPage } from '../pages/JobPostingPage';
// @ts-expect-error - Auto-patched TS2307
import { ApplicantPage } from '../pages/ApplicantPage';
// @ts-expect-error - Auto-patched TS2307
import { InterviewPage } from '../pages/InterviewPage';
// @ts-expect-error - Auto-patched TS2307
import { OfferPage } from '../pages/OfferPage';
// @ts-expect-error - Auto-patched TS2307
import { RecruitmentDetailPage } from '../pages/recruitmentDetailPage';

export const recruitmentRoutes: RouteObject[] = [
  { path: '', element: <RecruitmentListPage /> },
  { path: 'postings/new', element: <JobPostingPage /> },
  { path: 'applicants', element: <ApplicantPage /> },
  { path: 'interviews', element: <InterviewPage /> },
  { path: 'offers', element: <OfferPage /> },
  { path: ':id', element: <RecruitmentDetailPage /> },
];
