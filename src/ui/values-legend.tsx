import styles from "./values-legend.module.css";

const VALUES = [
  { name: "Mandiri", swatch: styles.mandiri },
  { name: "Empati", swatch: styles.empati },
  { name: "Disiplin", swatch: styles.disiplin },
  { name: "Adaptif", swatch: styles.adaptif },
  { name: "Loyal", swatch: styles.loyal },
  { name: "Integritas", swatch: styles.integritas },
];

export function ValuesLegend() {
  return (
    <div className={styles.legend}>
      Nilai karakter MEDALI
      <ul className={styles.list}>
        {VALUES.map((value) => (
          <li key={value.name} className={styles.value}>
            <i className={`${styles.swatch} ${value.swatch}`} />
            {value.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
