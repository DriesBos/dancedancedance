import styles from './ActionButton.module.sass';

type ActionButtonLinkType = 'email' | 'url';
type ActionButtonDropPage = 'home' | 'projects' | 'about' | 'blurbs';

interface ActionButtonProps {
  copy: string;
  link: string;
  linkType?: ActionButtonLinkType;
  className?: string;
  cursorMessage?: string;
  dropLeftPx?: number;
  dropCenterPercent?: number;
  dropDelayMs?: number;
  dropOnPage?: ActionButtonDropPage;
}

const EMAIL_LIKE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+(?:\?.*)?$/;

const isEmailLink = (link: string, linkType?: ActionButtonLinkType) => {
  if (linkType) {
    return linkType === 'email';
  }
  return link.startsWith('mailto:') || EMAIL_LIKE_REGEX.test(link);
};

const getEmailHref = (link: string) =>
  link.startsWith('mailto:') ? link : `mailto:${link}`;

const getUrlHref = (link: string) => {
  if (
    link.startsWith('http://') ||
    link.startsWith('https://') ||
    link.startsWith('//')
  ) {
    return link;
  }
  return `https://${link}`;
};

const ActionButton = ({
  copy,
  link,
  linkType,
  className = '',
  cursorMessage,
  dropLeftPx,
  dropCenterPercent,
  dropDelayMs,
  dropOnPage,
}: ActionButtonProps) => {
  const isEmail = isEmailLink(link, linkType);
  const href = isEmail ? getEmailHref(link) : getUrlHref(link);

  return (
    <a
      href={href}
      className={`${styles.actionButton} ${className}`.trim()}
      target={isEmail ? undefined : '_blank'}
      rel={isEmail ? undefined : 'noopener noreferrer'}
      data-cursor-message={cursorMessage}
      data-action-drop-left={dropLeftPx}
      data-action-drop-center-percent={dropCenterPercent}
      data-action-drop-delay-ms={dropDelayMs}
      data-action-drop-page={dropOnPage}
    >
      <span className={styles.copy}>{copy}</span>
    </a>
  );
};

export default ActionButton;
