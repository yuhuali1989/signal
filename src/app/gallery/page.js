'use client';
import { useEffect } from 'react';

export default function GalleryRedirect() {
  useEffect(() => {
    sessionStorage.setItem('modelInitTab', 'gallery');
    window.location.replace('/models/');
  }, []);
  return null;
}
