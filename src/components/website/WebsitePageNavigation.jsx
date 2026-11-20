import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { dropdownPages } from "@/lib/websitePages";
import { cn } from "@/lib/utils";

export default function WebsitePageNavigation({ pages, currentPage, onSelect }) {
  const keys = new Set(pages.map((page) => page.page_key));
  const topLevel = pages.filter((page) => !page.parent_page_key || !keys.has(page.parent_page_key));
  const buttonClass = (active) => cn(
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  );

  return (
    <nav aria-label="Page content" className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/60 w-fit">
      {topLevel.map((page) => {
        const children = dropdownPages(pages, page.page_key);
        const active = currentPage === page.page_key || children.some((child) => child.page_key === currentPage);
        if (!children.length) return (
          <button key={page.id} type="button" onClick={() => onSelect(page.page_key)} aria-current={active ? "page" : undefined} className={buttonClass(active)}>
            {page.label}
          </button>
        );
        return (
          <DropdownMenu key={page.id}>
            <DropdownMenuTrigger asChild>
              <button type="button" className={buttonClass(active)}>
                {page.label}<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem onSelect={() => onSelect(page.page_key)} aria-current={currentPage === page.page_key ? "page" : undefined}>
                {page.label} overview
                {currentPage === page.page_key && <Check className="ml-auto" aria-hidden="true" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {children.map((child) => (
                <DropdownMenuItem key={child.id} onSelect={() => onSelect(child.page_key)} aria-current={currentPage === child.page_key ? "page" : undefined}>
                  {child.label}
                  {currentPage === child.page_key && <Check className="ml-auto" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}