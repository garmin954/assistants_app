import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function sleep(wait: number = 3000) {
  return new Promise(resolve => setTimeout(resolve, wait))
}


export function formatBytes(bytes: number): string {
  if (bytes >= 1099511627776) {
    return (bytes / 1099511627776).toFixed(2) + 'T';
  } else if (bytes >= 1073741824) {
    return (bytes / 1073741824).toFixed(2) + 'GB';
  } else if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(2) + 'MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + 'KB';
  } else {
    return bytes + 'B';
  }
}


export function formatSpeed(speed: number): string {
  if (speed >= 1073741824) {
    return (speed / 1073741824).toFixed(2) + ' GB/s';
  } else if (speed >= 1048576) {
    return (speed / 1048576).toFixed(2) + ' MB/s';
  } else if (speed >= 1024) {
    return (speed / 1024).toFixed(2) + ' KB/s';
  } else {
    return speed.toFixed(2) + ' B/s';
  }
}


export function enterEvent(e: React.KeyboardEvent<HTMLInputElement>, fnc: () => void, blur = false) {
  const { type } = e;
  const isEnterKey =
    (e as React.KeyboardEvent<HTMLInputElement>).key === "Enter";
  const isClickEvent = type === "click";

  if ((type === "keydown" && isEnterKey) || isClickEvent) {
    blur && e.currentTarget.blur();
    fnc()
  }
}


export function getVersionNumber(str: string): string {
  const parts = str.split('_');
  const versionPartIndex = parts.length - 1;
  const versionPart = parts[versionPartIndex];
  const dotIndex = versionPart.lastIndexOf('.');
  if (dotIndex !== -1) {
    return versionPart.substring(0, dotIndex);
  }
  return versionPart;
}


export function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  const length = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < length; i++) {
    const v1 = parts1[i] || 0;
    const v2 = parts2[i] || 0;
    if (v1 > v2) {
      return 1;
    } else if (v1 < v2) {
      return -1;
    }
  }
  return 0;
}


export function deepClone<T>(source: T, seen = new WeakMap()): T {
  if (source === null || typeof source !== 'object') {
    return source;
  }

  if (seen.has(source)) {
    return seen.get(source);
  }

  if (source instanceof Date) {
    const copy = new Date(source.getTime()) as unknown as T;
    seen.set(source, copy);
    return copy;
  }

  if (source instanceof RegExp) {
    const copy = new RegExp(source.source, source.flags) as unknown as T;
    seen.set(source, copy);
    return copy;
  }

  if (Array.isArray(source)) {
    const copy = [] as unknown[];
    seen.set(source, copy);
    for (const item of source) {
      copy.push(deepClone(item, seen));
    }
    return copy as unknown as T;
  }

  const copy = {} as { [key: string]: any };
  seen.set(source, copy);
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      copy[key] = deepClone(source[key], seen);
    }
  }

  return copy as T;
}




type RspData = {
  code: number;
  msg: string;
}

// 响应信息提示
export function responseTips(data: RspData) {
  const { code, msg } = data
  // 10002 错误信息
  if (code === 10002) {
    return toast.error(msg);
  }

  // 10003 提示信息
  if (code === 10003) {
    return toast.info(msg);
  }
  // ...
}


type Point = {
  x: number,
  y: number,
}
export function isPointInsideDiv(point: Point, div: HTMLElement) {
  const rect = div.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}



export const toRadian = (degree: number) => {
  return Math.PI / 180 * degree;
}
// toAngle
export const toAngle = (radian: number) => {
  return radian / Math.PI * 180;
}