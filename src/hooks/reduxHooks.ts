import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, RootDispatch } from '@/store';

// 类型化的 useDispatch 钩子
export const useAppDispatch = () => useDispatch<RootDispatch>();

// 类型化的 useSelector 钩子
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
