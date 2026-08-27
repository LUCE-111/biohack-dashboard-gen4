declare module 'react' {
  export type SetStateAction<State> = State | ((previousState: State) => State);
  export type Dispatch<Action> = (value: Action) => void;

  export interface MutableRefObject<Value> {
    current: Value;
  }

  export interface ChangeEvent<Target extends Element = Element> extends Event {
    currentTarget: EventTarget & Target;
    target: EventTarget & Target;
  }

  export function useState<State>(initialState: State | (() => State)): [State, Dispatch<SetStateAction<State>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<Value>(factory: () => Value, dependencies: readonly unknown[]): Value;
  export function useRef<Value>(initialValue: Value): MutableRefObject<Value>;

  export interface StrictModeProps {
    children?: unknown;
  }

  export function StrictMode(props: StrictModeProps): JSX.Element;
}

declare module 'react-dom' {
  export function createPortal(children: unknown, container: Element | DocumentFragment): JSX.Element;
}

declare module 'react-dom/client' {
  export interface Root {
    render(node: unknown): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: string): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: string): JSX.Element;
}

declare namespace JSX {
  interface Element {}

  interface IntrinsicAttributes {
    key?: string | number;
  }

  interface IntrinsicElementProps {
    children?: unknown;
    className?: string;
    id?: string;
    role?: string;
    title?: string;
    style?: Readonly<Record<string, string | number>>;
    ref?: ((instance: HTMLElement | null) => void) | undefined;
    onClick?: (() => void) | undefined;
    [property: string]: unknown;
  }

  interface IntrinsicElements {
    [elementName: string]: IntrinsicElementProps;
  }
}
