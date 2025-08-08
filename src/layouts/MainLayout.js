import React from "react";

function MainLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Main Layout</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default MainLayout;