/** Fallback for unknown URLs. */
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/States.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return <div className="container-page py-20"><EmptyState icon={Compass} title="Page not found" message="The page you’re looking for doesn’t exist." action={<Link to="/" className="btn-primary">Back to home</Link>} /></div>;
}
