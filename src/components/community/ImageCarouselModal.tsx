import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Play, FileText, ExternalLink } from "lucide-react";

const getFileName = (url: string) => {
    try {
        return decodeURIComponent(new URL(url).pathname.split('/').pop() || '') || 'Document';
    } catch {
        return 'Document';
    }
};

// Document slide. The file server blocks PDFs from being embedded or fetched by this
// site, so instead of a preview show a card that opens the file in a new tab.
const DocumentCard = ({ url, title }: { url: string; title?: string }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-10 py-8 text-white text-center max-w-sm transition-colors"
    >
        <FileText size={56} />
        {/* Inline style, not text-base + font-semibold: theme.css forces that class combo to the dark text color */}
        <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 600 }}>{title || 'Document'}</span>
        <span className="text-xs !text-white/70 break-all line-clamp-2">{getFileName(url)}</span>
        <span className="mt-2 flex items-center gap-2 text-sm font-medium rounded-full bg-white text-black px-4 py-2 group-hover:bg-white/90">
            Click to view <ExternalLink size={14} />
        </span>
    </a>
);

interface Attachment {
    id: number;
    document_content_type: string;
    url: string;
    /** Optional heading for document slides (e.g. the member the file belongs to) */
    title?: string;
}

interface ImageCarouselModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachments: Attachment[];
    initialIndex?: number;
    /** Also show non-image/video files: PDFs are previewed inline, others get an "Open file" link.
     *  Off by default so callers that index into image/video-only lists keep working. */
    includeDocuments?: boolean;
}

export const ImageCarouselModal = ({
    open,
    onOpenChange,
    attachments,
    initialIndex = 0,
    includeDocuments = false,
}: ImageCarouselModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const isImage = (att: Attachment) => att.document_content_type.startsWith('image/');
    const isVideo = (att: Attachment) => att.document_content_type.startsWith('video/');

    const media = attachments.filter(att => includeDocuments || isImage(att) || isVideo(att));

    if (media.length === 0) return null;

    const currentMedia = media[Math.min(currentIndex, media.length - 1)];
    const isCurrentVideo = isVideo(currentMedia);

    const handlePrevious = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? media.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev === media.length - 1 ? 0 : prev + 1
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            handlePrevious();
        } else if (e.key === "ArrowRight") {
            handleNext();
        } else if (e.key === "Escape") {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 bg-black border-0 flex flex-col"
                style={{ maxWidth: '70vw', height: '90vh' }}
                onKeyDown={handleKeyDown}
            >
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="bg-white/30 hover:bg-white/40 text-white rounded-full"
                    >
                        <X size={24} />
                    </Button>
                </div>

                {/* Main Image Container */}
                <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden" style={{ height: 'calc(90vh - 120px)' }}>
                    <div className="relative w-full h-full flex items-center justify-center">
                        {isCurrentVideo ? (
                            <video
                                src={currentMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full object-contain"
                                key={currentMedia.id}
                            />
                        ) : !isImage(currentMedia) ? (
                            <DocumentCard url={currentMedia.url} title={currentMedia.title} />
                        ) : (
                            <img
                                src={currentMedia.url}
                                alt={`Media ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    {media.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronLeft size={32} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronRight size={32} />
                            </Button>
                        </>
                    )}
                </div>

                {/* Image Counter and Thumbnails Footer */}
                {media.length > 1 && (
                    <div className="bg-black/80 p-4 space-y-4">
                        {/* Counter */}
                        <div className="flex items-center justify-between px-4">
                            <div className="text-white text-sm font-medium">
                                {currentIndex + 1} / {media.length}
                            </div>

                            {/* Dots Indicator */}
                            <div className="flex gap-2 justify-center">
                                {media.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`h-2 rounded-full transition-all ${idx === currentIndex
                                            ? "bg-white w-6"
                                            : "bg-white/40 w-2 hover:bg-white/60"
                                            }`}
                                        aria-label={`Go to media ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Thumbnail Carousel */}
                        <div className="flex gap-2 overflow-x-auto pb-2 px-4">
                            {media.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all border-2 relative ${idx === currentIndex
                                        ? "border-white"
                                        : "border-white/30 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    {!isImage(item) && !isVideo(item) ? (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 text-white">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    ) : isVideo(item) ? (
                                        <>
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
