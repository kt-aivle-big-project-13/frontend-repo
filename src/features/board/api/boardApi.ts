import { apiClient } from '../../../shared/api/client';

export type BoardSort = 'latest' | 'oldest';

export interface PostSummary {
  id: number;
  title: string;
  authorName: string;
  pinned: boolean;
  commentCount: number;
  createdAt: string;
}

export interface Attachment {
  id: number;
  originalName: string;
  size: number;
}

export interface PostDetail {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  pinned: boolean;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface FetchPostsParams {
  page: number;
  size?: number;
  keyword?: string;
  sort?: BoardSort;
}

export async function fetchPosts(
  params: FetchPostsParams,
): Promise<PageResponse<PostSummary>> {
  const { data } = await apiClient.get<PageResponse<PostSummary>>('/posts', {
    params,
  });

  return data;
}

export async function fetchPost(postId: number): Promise<PostDetail> {
  const { data } = await apiClient.get<PostDetail>(`/posts/${postId}`);
  return data;
}

export interface PostCreateInput {
  title: string;
  content: string;
  files?: File[];
}

function buildPostFormData(input: {
  title: string;
  content: string;
  files?: File[];
  deleteAttachmentIds?: number[];
}): FormData {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('content', input.content);

  (input.files ?? []).forEach((file) => {
    formData.append('files', file);
  });

  (input.deleteAttachmentIds ?? []).forEach((id) => {
    formData.append('deleteAttachmentIds', String(id));
  });

  return formData;
}

export async function createPost(input: PostCreateInput): Promise<PostDetail> {
  // Content-Type을 직접 지정하면 axios/브라우저가 FormData에 맞춰 자동으로
  // 채우는 boundary가 빠져 서버가 멀티파트 본문을 파싱하지 못한다.
  const { data } = await apiClient.post<PostDetail>(
    '/posts',
    buildPostFormData(input),
  );

  return data;
}

export interface PostUpdateInput {
  title: string;
  content: string;
  files?: File[];
  deleteAttachmentIds?: number[];
}

export async function updatePost(
  postId: number,
  input: PostUpdateInput,
): Promise<PostDetail> {
  const { data } = await apiClient.patch<PostDetail>(
    `/posts/${postId}`,
    buildPostFormData(input),
  );

  return data;
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}

export async function pinPost(
  postId: number,
  pinned: boolean,
): Promise<PostDetail> {
  const { data } = await apiClient.patch<PostDetail>(`/posts/${postId}/pin`, {
    pinned,
  });

  return data;
}

export async function fetchComments(postId: number): Promise<Comment[]> {
  const { data } = await apiClient.get<Comment[]>(`/posts/${postId}/comments`);
  return data;
}

export async function createComment(
  postId: number,
  content: string,
): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(
    `/posts/${postId}/comments`,
    { content },
  );

  return data;
}

export async function updateComment(
  postId: number,
  commentId: number,
  content: string,
): Promise<Comment> {
  const { data } = await apiClient.patch<Comment>(
    `/posts/${postId}/comments/${commentId}`,
    { content },
  );

  return data;
}

export async function deleteComment(
  postId: number,
  commentId: number,
): Promise<void> {
  await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
}

// 인증 헤더가 필요해 <a href>로 바로 내려받을 수 없으므로, blob으로 받아 임시 링크를 눌러 저장한다.
export async function downloadAttachment(
  postId: number,
  attachment: Attachment,
): Promise<void> {
  const response = await apiClient.get(
    `/posts/${postId}/attachments/${attachment.id}`,
    { responseType: 'blob' },
  );

  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}