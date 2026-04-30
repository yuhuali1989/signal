'use client';
import { useEffect } from 'react';

export default function BenchmarksRedirect() {
  useEffect(() => {
    sessionStorage.setItem('modelInitTab', 'leaderboard');
    window.location.replace('/models/');
  }, []);
  return null;
}
