import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const communityPosts = [
  {
    id: 1,
    author: "Jane Doe",
    authorAvatarId: "user-avatar-1",
    title: "Kết quả thử thách ăn uống lành mạnh 30 ngày của tôi!",
    snippet: "Tôi không thể tin được sự khác biệt mà nó đã tạo ra! Tôi đã giảm 5kg, mức năng lượng của tôi tăng vọt, và tôi chưa bao giờ cảm thấy tốt hơn. Đây là những gì tôi đã làm và những gì tôi đã học được trên đường đi...",
    tags: ["Câu chuyện thành công", "Ăn uống lành mạnh"],
    likes: 128,
    comments: 42,
    imageId: "community-1",
  },
  {
    id: 2,
    author: "John Smith",
    authorAvatarId: "user-avatar-2",
    title: "Mẹo để duy trì động lực tập thể dục?",
    snippet: "Tôi luôn bắt đầu mạnh mẽ, nhưng sau một hoặc hai tuần, tôi mất động lực. Mẹo và thủ thuật của bạn để duy trì sự nhất quán với các bài tập của bạn là gì, đặc biệt là vào những ngày bận rộn?",
    tags: ["Động lực", "Thể hình", "Thảo luận"],
    likes: 76,
    comments: 89,
    imageId: "community-2",
  },
];

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Diễn đàn cộng đồng"
        description="Kết nối với những người khác, chia sẻ hành trình của bạn và tìm kiếm sự hỗ trợ."
      />
      <div className="space-y-8">
        {communityPosts.map((post) => {
          const authorAvatar = PlaceHolderImages.find(p => p.id === post.authorAvatarId);
          const postImage = PlaceHolderImages.find(p => p.id === post.imageId);
          return (
            <Card key={post.id} className="overflow-hidden">
              {postImage && (
                <div className="aspect-video relative">
                  <Image
                    src={postImage.imageUrl}
                    alt={postImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={postImage.imageHint}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={post.author} data-ai-hint={authorAvatar.imageHint}/>}
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{post.author}</span>
                </div>
                <CardTitle className="pt-4 text-2xl font-headline">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {post.snippet}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/50 p-4">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> {post.comments}
                  </span>
                </div>
                <Button>Đọc thêm</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
