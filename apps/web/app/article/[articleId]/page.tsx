import { ArticlePage } from "@/components/screens/ArticlePage";

export default async function Page({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  return <ArticlePage articleId={articleId} />;
}
