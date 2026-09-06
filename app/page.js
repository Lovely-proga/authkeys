export default function Home() {
  return (
    <div className="wrap">
      <div className="card">
        <h1>AuthKeys</h1>
        <p className="muted">
          Система авторизации по ключам подключена и работает.
        </p>
        <p className="muted">
          Панель управления ключами находится на странице{" "}
          <a href="/admin" style={{ color: "#a5b4fc" }}>/admin</a>.
        </p>
      </div>
    </div>
  );
}
