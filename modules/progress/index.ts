// Progress module — delegates to user-courses for now.
// This module exists as a bounded context boundary for future analytics/reporting.
export { getCompletedTopics, markTopicComplete, unmarkTopicComplete } from '@/modules/user-courses';
export type * from './types';
