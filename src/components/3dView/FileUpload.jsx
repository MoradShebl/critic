import React, { useRef, useState } from 'react';

const FileUpload = ({ onFileSelect, acceptedFormats = ".fbx,.obj,.gltf,.glb" }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  };

  const isValidFile = (file) => {
    const validExtensions = ['.fbx', '.obj', '.gltf', '.glb'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(fileExtension);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="upload-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17,8 12,3 7,8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="upload-text">Upload 3D Model</div>
      <div className="upload-subtext">
        Drag and drop your property model here, or click to browse
        <br />
        <strong>Supported formats:</strong> FBX, OBJ, GLTF, GLB
      </div>
      <button className="btn" style={{ marginTop: '1rem' }}>
        Choose File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept={acceptedFormats}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default FileUpload;