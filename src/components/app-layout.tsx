import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar-1");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="sm:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex w-full items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    {userAvatar && (
                      <AvatarImage
                        src={userAvatar.imageUrl}
                        alt={userAvatar.description}
                        data-ai-hint={userAvatar.imageHint}
                      />
                    )}
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
                <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
