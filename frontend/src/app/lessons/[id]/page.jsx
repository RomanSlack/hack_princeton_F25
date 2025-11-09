import { LESSONS } from '../../../data/lessons';
import LessonClient from './LessonClient';

// Generate static params for all available lessons
export function generateStaticParams() {
  return LESSONS.map((lesson) => ({
    id: lesson.id.toString(),
  }));
}

// Server component that passes data to client component
export default function LessonPage() {
  return <LessonClient />;
}
