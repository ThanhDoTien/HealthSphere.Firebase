import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Heart, MessageCircle, Send } from "lucide-react";

const communityPosts = [
  {
    id: 1,
    author: "Jane Doe",
    authorUserId: "jane-doe",
    authorAvatarId: "user-avatar-1",
    timestamp: "2 giờ trước",
    content: "Vừa hoàn thành chặng chạy 5km của tôi! Cảm thấy thật tuyệt vời và tràn đầy năng lượng. Tuần này ai có mục tiêu chạy bộ không? 💪 #running #fitnessgoals",
    imageId: "community-post-2",
    likes: 24,
    comments: 3,
  },
  {
    id: 2,
    author: "John Smith",
    authorUserId: "john-smith",
    authorAvatarId: "user-avatar-2",
    timestamp: "8 giờ trước",
    content: "Đã thử công thức gà nướng và măng tây từ trang công thức nấu ăn. Rất ngon! Một bữa tối lành mạnh và dễ dàng. Rất khuyến khích!",
    imageId: "recipe-2",
    likes: 42,
    comments: 9,
  },
  {
    id: 3,
    author: "Alex Doe",
    authorUserId: "alex-doe",
    authorAvatarId: "user-avatar-1",
    timestamp: "Hôm qua",
    content: "Bắt đầu ngày mới với những chiếc bánh taco lành mạnh này cho bữa trưa. Rất ngon và đầy đủ dinh dưỡng!",
    imageId: "community-post-3",
    likes: 58,
    comments: 12,
  }
];


export default function CommunityPage() {
  const loggedInUserAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar-1");

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Cộng đồng"
        description="Kết nối với những người khác, chia sẻ tiến trình của bạn và tìm nguồn cảm hứng."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
                 <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                     {loggedInUserAvatar && (
                        <Avatar>
                            <AvatarImage src={loggedInUserAvatar.imageUrl} alt="Your avatar" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                     )}
                    <div className="flex-grow">
                        <Input placeholder="Bạn đang nghĩ gì, Alex?" />
                    </div>
                 </CardHeader>
                 <CardFooter className="flex justify-between">
                    <Button variant="outline">Thêm ảnh/video</Button>
                    <Button>
                        <Send className="mr-2 h-4 w-4" /> Đăng bài
                    </Button>
                 </CardFooter>
            </Card>

            {/* Posts Feed */}
            {communityPosts.map((post) => {
                 const authorAvatar = PlaceHolderImages.find((p) => p.id === post.authorAvatarId);
                 const postImage = PlaceHolderImages.find((p) => p.id === post.imageId);
                return (
                    <Card key={post.id}>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                {authorAvatar && (
                                    <Avatar>
                                        <AvatarImage src={authorAvatar.imageUrl} alt={post.author} />
                                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div>
                                    <Link href={`/profile/${post.authorUserId}`} className="font-semibold hover:underline">{post.author}</Link>
                                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">{post.content}</p>
                            {postImage && (
                                <div className="aspect-video overflow-hidden rounded-lg border">
                                <Image
                                    src={postImage.imageUrl}
                                    alt="Post image"
                                    width={800}
                                    height={450}
                                    className="h-full w-full object-cover"
                                    data-ai-hint={postImage.imageHint}
                                />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                           <div className="flex gap-4 text-muted-foreground">
                             <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes}</span>
                            </Button>
                             <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.comments}</span>
                             </Button>
                           </div>
                           <Button variant="ghost" size="sm">Chia sẻ</Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chủ đề thịnh hành</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary"><Link href="#">#BữaĂnLànhMạnh</Link></li>
                <li className="hover:text-primary"><Link href="#">#ThửTháchChạyBộ</Link></li>
                <li className="hover:text-primary"><Link href="#">#BiếnĐổiThứHai</Link></li>
                <li className="hover:text-primary"><Link href="#">#YogaMỗiNgày</Link></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
