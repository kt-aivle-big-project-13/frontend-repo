import { useQuery } from '@tanstack/react-query';

import { getHealth } from '@shared/api/health';

import { QueryProvider } from './providers/QueryProvider';

function HealthStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  if (isLoading) return <div>백엔드 연동 확인 중...</div>;
  if (isError) return <div>백엔드 연동 실패</div>;

  return (
    <div>
      백엔드 연동 성공 (id: {data?.id}, checkedAt: {data?.checkedAt})
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <HealthStatus />
    </QueryProvider>
  );
}

export default App;