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
    title: "My 30-Day Healthy Eating Challenge Results!",
    snippet: "I can't believe the difference it made! I lost 5kg, my energy levels are through the roof, and I've never felt better. Here's what I did and what I learned along the way...",
    tags: ["Success Story", "Healthy Eating"],
    likes: 128,
    comments: 42,
    imageId: "community-1",
  },
  {
    id: 2,
    author: "John Smith",
    authorAvatarId: "user-avatar-2",
    title: "Tips for Staying Motivated to Exercise?",
    snippet: "I always start strong, but after a week or two, I lose motivation. What are your tips and tricks for staying consistent with your workouts, especially on busy days?",
    tags: ["Motivation", "Fitness", "Discussion"],
    likes: 76,
    comments: 89,
    imageId: "community-2",
  },
];

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Community Forums"
        description="Connect with others, share your journey, and find support."
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
                <Button>Read More</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
