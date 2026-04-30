'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 从 URL hash 中解析参数
 * 支持格式: #tab=gallery&model=sora  或  #gallery（单值兼容）
 */
function parseHash() {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.slice(1); // 去掉 #
  if (!hash) return {};
  const params = {};
  hash.split('&').forEach(part => {
    const [key, val] = part.split('=');
    if (key && val !== undefined) {
      params[decodeURIComponent(key)] = decodeURIComponent(val);
    } else if (key) {
      // 兼容 #gallery 这种单值格式，存为 _default
      params._default = decodeURIComponent(key);
    }
  });
  return params;
}

/**
 * 将参数对象序列化为 hash 字符串
 */
function serializeHash(params) {
  const parts = [];
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  });
  return parts.join('&');
}

/**
 * useHashState — 将状态同步到 URL hash
 *
 * @param {string} key - hash 参数名（如 'tab', 'model', 'type'）
 * @param {string} defaultValue - 默认值
 * @returns {[string, function]} - 与 useState 相同的 [value, setValue] 接口
 *
 * 用法:
 *   const [activeTab, setActiveTab] = useHashState('tab', 'gallery');
 *   // URL 会变为 #tab=gallery
 *   // 用户可以复制链接，打开后自动恢复状态
 */
export default function useHashState(key, defaultValue) {
  // 始终用默认值初始化（保证 SSR 和客户端首次渲染一致，避免 hydration 错误）
  const [value, setValue] = useState(defaultValue);

  const isInternalUpdate = useRef(false);
  const hasMounted = useRef(false);

  // 客户端挂载后，从 hash 读取初始值
  useEffect(() => {
    const params = parseHash();
    const hashValue = params[key];
    if (hashValue !== undefined && hashValue !== defaultValue) {
      setValue(hashValue);
    }
    hasMounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 当 value 变化时，同步写入 hash（仅在挂载后）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasMounted.current) return;
    isInternalUpdate.current = true;

    const params = parseHash();
    if (value === defaultValue) {
      // 如果是默认值，从 hash 中移除该 key（保持 URL 简洁）
      delete params[key];
    } else {
      params[key] = value;
    }
    // 移除兼容的 _default key
    delete params._default;

    const newHash = serializeHash(params);
    const newUrl = newHash ? `#${newHash}` : window.location.pathname + window.location.search;

    // 使用 replaceState 避免产生过多历史记录
    window.history.replaceState(null, '', newUrl);

    // 短暂延迟后重置标志
    requestAnimationFrame(() => {
      isInternalUpdate.current = false;
    });
  }, [key, value, defaultValue]);

  // 监听浏览器前进/后退（popstate）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      if (isInternalUpdate.current) return;
      const params = parseHash();
      const hashValue = params[key];
      setValue(hashValue ?? defaultValue);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [key, defaultValue]);

  return [value, setValue];
}
