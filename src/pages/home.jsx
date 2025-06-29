import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Welcome to the 3D Viewer App</h1>
      <p>
        <Link to="/3d" style={{ fontSize: 20, color: "#007bff" }}>
          Go to 3D Viewer
        </Link>
      </p>
    </div>
  );
}

export default Home