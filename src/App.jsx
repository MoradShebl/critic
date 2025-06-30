import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import View3d from "./pages/view3d";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/3d" element={<View3d />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;