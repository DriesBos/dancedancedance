import styles from './ActionButton.module.sass';
import GrainyGradient from '../GrainyGradient';
import IconMail from '../Icons/IconMail';
import IconCalendar from '../Icons/IconCalendar';

type ActionButtonLinkType = 'email' | 'url';
type ActionButtonDropPage = 'home' | 'projects' | 'about';

interface ActionButtonProps {
  copy: string;
  link?: string;
  onClick?: () => void;
  linkType?: ActionButtonLinkType;
  className?: string;
  cursorMessage?: string;
  dropLeftPx?: number;
  dropCenterPercent?: number;
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

const sharedProps = (
  className: string,
  cursorMessage: string | undefined,
  dropLeftPx: number | undefined,
  dropCenterPercent: number | undefined,
  dropOnPage: ActionButtonDropPage | undefined,
) => ({
  className: `${styles.actionButton} ${className}`.trim(),
  'data-cursor-message': cursorMessage,
  'data-action-drop-left': dropLeftPx,
  'data-action-drop-center-percent': dropCenterPercent,
  'data-action-drop-page': dropOnPage,
});

const ActionButton = ({
  copy,
  link,
  onClick,
  linkType,
  className = '',
  cursorMessage,
  dropLeftPx,
  dropCenterPercent,
  dropOnPage,
}: ActionButtonProps) => {
  const props = sharedProps(className, cursorMessage, dropLeftPx, dropCenterPercent, dropOnPage);

  if (onClick) {
    return (
      <button type="button" onClick={onClick} {...props}>
        <GrainyGradient variant="blok" />
        <span className={styles.copy}>{copy}</span>
      </button>
    );
  }

  const isEmail = isEmailLink(link ?? '', linkType);
  const href = isEmail ? getEmailHref(link ?? '') : getUrlHref(link ?? '');

  return (
    <a
      href={href}
      {...props}
      target={isEmail ? undefined : '_blank'}
      rel={isEmail ? undefined : 'noopener noreferrer'}
    >
      <GrainyGradient variant="blok" />
      <span className={styles.copy}>{copy}</span>
      <div className={`${styles.icon} icon`}>
        {isEmail ? <IconMail /> : <IconCalendar />}
      </div>
    </a>
  );
};

export default ActionButton;
