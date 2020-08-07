import styles from './Header.module.scss';
import { FiGithub } from 'react-icons/fi';

const Header = () => (
    <header className={styles.header}>
        <h1>Football World Cup Rankings</h1>
        <a
            className={styles.githubLink}
            target="_blank"
            href="https://github.com/hideyuk1/football-world-cup-rankings"
            rel="noopener noreferrer"
        >
            <FiGithub className={styles.githubLink} />
        </a>
    </header>
);
export default Header;
