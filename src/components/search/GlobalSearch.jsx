import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, File, Folder, BookOpen, Users, Calendar, Mail, Briefcase, X, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SEARCH_CATEGORIES = [
  { id: 'portals', label: 'Portals & Pages', icon: Folder },
  { id: 'files', label: 'Files', icon: File },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'projects', label: 'Projects', icon: Briefcase },
];

export default function GlobalSearch({ user, access }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    const searchResults = [];

    try {
      // Search Portals
      const portals = await base44.entities.PortalCard.list();
      const accessiblePortals = portals.filter(card => access.canAccessCard(card));
      const matchedPortals = accessiblePortals.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      
      searchResults.push({
        category: 'portals',
        items: matchedPortals.map(p => ({
          id: p.id,
          title: p.name,
          description: p.description,
          url: p.url,
          icon: p.icon || 'Folder',
          color: p.color,
        }))
      });

      // Search Files
      const files = await base44.entities.File.filter({}).then(f => f.slice(0, 50));
      const matchedFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      
      searchResults.push({
        category: 'files',
        items: matchedFiles.map(f => ({
          id: f.id,
          title: f.name,
          description: f.file_type,
          url: `/filemanager/view?file=${f.id}`,
          icon: 'File',
        }))
      });

      // Search Notes
      const notes = await base44.entities.Note.filter({}).then(n => n.slice(0, 50));
      const matchedNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      
      searchResults.push({
        category: 'notes',
        items: matchedNotes.map(n => ({
          id: n.id,
          title: n.title,
          description: n.content?.substring(0, 100) + '...',
          url: `/filemanager/notes`,
          icon: 'BookOpen',
        }))
      });

      // Search Clients (if user has access)
      if (access.canAccessPortal('pathways')) {
        const clients = await base44.entities.Client.filter({}).then(c => c.slice(0, 50));
        const matchedClients = clients.filter(c =>
          c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        
        searchResults.push({
          category: 'clients',
          items: matchedClients.map(c => ({
            id: c.id,
            title: c.full_name,
            description: c.email || 'Client',
            url: `/pathways/client/${c.id}`,
            icon: 'Users',
          }))
        });
      }

      // Search Events
      const events = await base44.entities.Event.filter({}).then(e => e.slice(0, 50));
      const matchedEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      
      searchResults.push({
        category: 'events',
        items: matchedEvents.map(e => ({
          id: e.id,
          title: e.name,
          description: `${new Date(e.start_date).toLocaleDateString()} - ${e.location || 'No location'}`,
          url: `/eventsmgr/events`,
          icon: 'Calendar',
        }))
      });

      // Search Projects
      const projects = await base44.entities.Project.filter({}).then(p => p.slice(0, 50));
      const matchedProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      
      searchResults.push({
        category: 'projects',
        items: matchedProjects.map(p => ({
          id: p.id,
          title: p.name,
          description: p.description?.substring(0, 100) || 'Project',
          url: `/eventsmgr/projects`,
          icon: 'Briefcase',
        }))
      });

      // Filter out empty categories
      setResults(searchResults.filter(cat => cat.items.length > 0));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      File, Folder, BookOpen, Users, Calendar, Briefcase, Mail
    };
    return iconMap[iconName] || Folder;
  };

  const totalResults = results.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search portals, files, notes, clients..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-[60vh] overflow-y-auto bg-card shadow-lg z-50">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm mt-2">Searching...</p>
            </div>
          ) : results.length === 0 && query ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </p>
              </div>
              {results.map((category) => {
                const CategoryIcon = getIconComponent(SEARCH_CATEGORIES.find(c => c.id === category.category)?.icon || 'Folder');
                return (
                  <div key={category.category} className="border-b border-border last:border-0">
                    <div className="px-4 py-2 flex items-center gap-2 bg-muted/50">
                      <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {SEARCH_CATEGORIES.find(c => c.id === category.category)?.label}
                      </span>
                    </div>
                    {category.items.map((item) => {
                      const ItemIcon = getIconComponent(item.icon);
                      return (
                        <Link
                          key={item.id}
                          to={item.url}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                          onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ItemIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}