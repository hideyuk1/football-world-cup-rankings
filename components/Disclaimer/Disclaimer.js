import React from 'react';
import styles from './Disclaimer.module.scss';

const Disclaimer = () => (
    <p className={styles.disclaimer}>
        The information provided by us on this website is for general informational purposes only.
        All information on this website is provided in good faith, however we make no representation
        or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity,
        reliability, availability or completeness of any information on this website. Under no
        circumstance shall we have any liability to you for any loss or damage of any kind incurred
        as a result of the use of this website or reliance on any information provided on this
        website. Your use of this website and your reliance on any information on this website is
        solely at your own risk.
    </p>
);

export default Disclaimer;
