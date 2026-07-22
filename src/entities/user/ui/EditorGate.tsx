import type { ReactNode } from 'react';

import { useHasEditorAccess } from '../model/permissions';

import './EditorGate.css';

interface EditorGateProps {
  children: ReactNode;
}

function EditorGate({ children }: EditorGateProps) {
  const hasEditorAccess = useHasEditorAccess();

  if (hasEditorAccess) {
    return <>{children}</>;
  }

  return (
    <p className="editor-gate__notice" role="alert">
      편집 권한이 필요합니다.
    </p>
  );
}

export default EditorGate;
