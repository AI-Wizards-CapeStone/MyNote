// components/PDFViewer.js
import React from "react";

const PDFViewer = ({ src } : any) => {
  return (
    <div style={{ width: "100%", height: "600px" }}>
      {src && (
        <iframe
          src={src}
          title="PDF Viewer"
          width="100%"
          height="100%"
        ></iframe>
      )}
    </div>
  );
};

export default PDFViewer;
