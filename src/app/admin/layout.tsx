import AdminNavigation from
  "@/components/admin/AdminNavigation";
import styles from
  "./admin-layout.module.css";
export default function AdminLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <div
      className={
        styles.layout
      }
    >
      <AdminNavigation />
      <main
        className={
          styles.content
        }
      >
        {children}
      </main>
    </div>
  );
}