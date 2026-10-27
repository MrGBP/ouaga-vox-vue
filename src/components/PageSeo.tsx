import { Helmet } from 'react-helmet-async';

const SITE = 'https://sapsaphouse.com';

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  /** Visually hidden page heading for pages without a visible <h1>. */
  heading?: string;
}

/** Per-route title, description, canonical and social tags. */
export default function PageSeo({ title, description, path, heading }: PageSeoProps) {
  const url = `${SITE}${path}`;
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Helmet>
      {heading && <h1 className="sr-only">{heading}</h1>}
    </>
  );
}
