/**
 * Framer 패키지 Mock
 * - Next.js 환경에서 Framer 컴포넌트를 사용하기 위한 mock
 * - addPropertyControls는 Framer 에디터에서만 사용되므로 no-op으로 처리
 */

// addPropertyControls는 Framer 에디터에서만 사용되므로 빈 함수로 처리
export function addPropertyControls(component: unknown, controls: unknown): void {
  // no-op in Next.js environment
}

// ControlType enum mock
export const ControlType = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Color: 'color',
  Enum: 'enum',
  Image: 'image',
  File: 'file',
  ComponentInstance: 'componentinstance',
  Array: 'array',
  Object: 'object',
  FusedNumber: 'fusednumber',
  Transition: 'transition',
  EventHandler: 'eventhandler',
  Link: 'link',
  Date: 'date',
  Time: 'time',
  DateTime: 'datetime',
  Font: 'font',
  RichText: 'richtext',
  Padding: 'padding',
  Border: 'border',
  BorderRadius: 'borderradius',
  BoxShadow: 'boxshadow',
  Cursor: 'cursor',
  Responsive: 'responsive',
} as const







