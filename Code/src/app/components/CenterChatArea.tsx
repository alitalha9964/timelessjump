import { useState, useEffect, useRef } from "react";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Download,
  Loader2,
  X,
  Maximize2,
  ZoomIn,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { api, getCurrentUserId } from "@/services/api";

interface ImageData {
  id: string;
  url: string;
  liked?: boolean;
  disliked?: boolean;
  isEditing?: boolean;
  editPrompt?: string;
  aspectRatio?: string;
  resolution?: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  images?: ImageData[];
  prompt?: string;
}

interface CenterChatAreaProps {
  sessionId: string | null;
  settings?: {
    selectedColor: string;
    resolution: string;
    aspectRatios: string[];
    imageFolder: string;
    imageFolderPath: string;
    generationMode: "single" | "multi";
    temperature: number;
    selectedModel: "nano-banana-pro" | "flux-klein-9b";
    productionType?: "single-product" | "bundle";
    selectedProducts?: string[];
  };
}

export function CenterChatArea({
  sessionId,
  settings,
}: CenterChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<
    string | null
  >(null);
  const [currentChatRoomId, setCurrentChatRoomId] = useState<
    string | null
  >(null);
  const [zoomedImage, setZoomedImage] =
    useState<ImageData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] =
    useState(true);
  const previousMessagesLength = useRef(0);

  useEffect(() => {
    if (
      shouldAutoScroll &&
      messages.length > previousMessagesLength.current
    ) {
      scrollToBottom();
    }
    previousMessagesLength.current = messages.length;
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    } else {
      setMessages([]);
      setCurrentChatRoomId(null);
    }
  }, [sessionId]);

  const loadSessionData = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await api.getSessionDetails(sessionId);

      if (response.chatroom_data) {
        const loadedMessages: Message[] = [];
        let messageId = 1;

        response.chatroom_data.forEach((thread: any) => {
          loadedMessages.push({
            id: messageId++,
            role: "user",
            content: thread.prompt,
          });

          if (thread.img_data && thread.img_data.length > 0) {
            const images: ImageData[] = thread.img_data.map(
              (img: any) => ({
                id: img.img_id,
                url: img.img_url,
                aspectRatio: img.aspect_ratio,
                resolution: img.resolution,
                liked: img.is_good === true,
                disliked: img.is_good === false,
              }),
            );

            loadedMessages.push({
              id: messageId++,
              role: "assistant",
              content: `I've generated ${images.length} image${images.length > 1 ? "s" : ""} for you.`,
              images,
              prompt: thread.prompt,
            });
          }
        });

        setMessages(loadedMessages);
        setCurrentChatRoomId(response.chatroom_id);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChatRoom = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const response = await api.createChatRoom(userId);
      return response.chatroom_id;
    } catch (error) {
      console.error("Failed to create chat room:", error);
      throw error;
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    // Create optimistic user message
    const newMessage: Message = {
      id: Date.now(), // Use timestamp for temporary ID to avoid conflicts
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, newMessage]);

    if (!overridePrompt) {
      setInputMessage("");
    }
    setLoading(true);

    try {
      let chatRoomId = currentChatRoomId;
      if (!chatRoomId) {
        chatRoomId = await createNewChatRoom();
        setCurrentChatRoomId(chatRoomId);
      }

      const imagePath =
        settings?.imageFolderPath || "gemini_images";
      const aspectRatios = settings?.aspectRatios || ["1:1"];
      const resolution = settings?.resolution || "1024x1024";
      const selectedColor =
        settings?.selectedColor || undefined;
      const generationMode =
        settings?.generationMode || "single";
      const temperature = settings?.temperature ?? 1.0;
      const currentImageFolder = settings?.imageFolder;
      const selectedModel =
        settings?.selectedModel || "nano-banana-pro";
      const productionType =
        settings?.productionType || "single-product";
      const selectedProductsList =
        settings?.selectedProducts || [];

      let response;

      // Bundle mode — uses the batch generation API with selected products
      if (productionType === "bundle") {
        if (selectedProductsList.length === 0) {
          throw new Error("Please select at least one product for bundle generation.");
        }
        console.log("Generating with Bundle/Batch API", selectedProductsList);
        response = await api.generateBatchImages(
          chatRoomId,
          textToSend,
          selectedProductsList,
          aspectRatios,
          resolution,
          temperature,
        );
      } else if (selectedModel === "flux-klein-9b") {
        // Flux Klein Distilled model routing
        if (generationMode === "single") {
          console.log(
            "Generating with Flux Klein Single Image API",
          );
          response = await api.generateSingleImageFluxKlein(
            chatRoomId,
            imagePath,
            textToSend,
            aspectRatios[0], // Flux Klein single takes a single aspect_ratio string
            selectedColor,
          );
        } else {
          console.log(
            "Generating with Flux Klein Multi Image API",
          );
          response = await api.generateMultipleImagesFluxKlein(
            chatRoomId,
            imagePath,
            textToSend,
            aspectRatios,
            selectedColor,
          );
        }
      } else if (generationMode === "single") {
        console.log("Generating with Single Image API");
        response = await api.generateSingleImage(
          chatRoomId,
          imagePath,
          textToSend,
          aspectRatios,
          resolution,
          selectedColor,
          temperature,
        );
      } else {
        response = await api.generateMultipleImages(
          chatRoomId,
          imagePath,
          textToSend,
          aspectRatios,
          resolution,
          selectedColor,
          temperature,
        );
      }

      const generatedImages: ImageData[] = [];

      if (response.image_reg) {
        response.image_reg.forEach((img: any) => {
          // Robust ID extraction - handle numeric or string IDs
          const rawId = img.img_id || img.image_id || img.id;
          const imageId = rawId
            ? String(rawId)
            : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          generatedImages.push({
            id: imageId,
            url: img.img_url || img.image_path || img.url,
            aspectRatio: img.aspect_ratio,
            resolution: img.resolution,
            liked: img.is_good === true,
            disliked: img.is_good === false,
          });
        });
      } else if (response.result) {
        // Normalize result to an array — Flux Klein single image returns a single object,
        // while multi image and other endpoints return an array
        const resultArray = Array.isArray(response.result)
          ? response.result
          : [response.result];
        resultArray.forEach((img: any) => {
          const rawId = img.image_id || img.img_id || img.id;
          const imageId = rawId
            ? String(rawId)
            : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          generatedImages.push({
            id: imageId,
            url: img.image_path || img.img_url || img.url,
            aspectRatio: img.aspect_ratio,
            resolution: img.resolution,
            liked: img.is_good === true,
            disliked: img.is_good === false,
          });
        });
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: `I've generated ${generatedImages.length} image${generatedImages.length > 1 ? "s" : ""} for you.`,
        images: generatedImages,
        prompt: textToSend,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error: any) {
      console.error("Error generating images:", error);

      const errorMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (
    messageId: number,
    imageId?: string,
  ) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId && imageId && msg.images) {
          return {
            ...msg,
            images: msg.images.map((img) => {
              if (img.id === imageId) {
                const newLikedState = !img.liked;
                api
                  .updateImageStatus(imageId, newLikedState)
                  .catch(console.error);
                return {
                  ...img,
                  liked: newLikedState,
                  disliked: false,
                };
              }
              return img;
            }),
          };
        }
        return msg;
      }),
    );
  };

  const handleDislike = async (
    messageId: number,
    imageId?: string,
  ) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId && imageId && msg.images) {
          return {
            ...msg,
            images: msg.images.map((img) => {
              if (img.id === imageId) {
                const newDislikedState = !img.disliked;
                api
                  .updateImageStatus(imageId, !newDislikedState)
                  .catch(console.error);
                return {
                  ...img,
                  disliked: newDislikedState,
                  liked: false,
                };
              }
              return img;
            }),
          };
        }
        return msg;
      }),
    );
  };

  const handleEditClick = (
    messageId: number,
    imageId: string,
    currentContent: string,
  ) => {
    setEditingImageId(imageId);
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId && msg.images) {
          return {
            ...msg,
            images: msg.images.map((img) =>
              img.id === imageId
                ? { ...img, isEditing: true, editPrompt: "" }
                : img,
            ),
          };
        }
        return msg;
      }),
    );
  };

  const handleEditSave = async (
    messageId: number,
    imageId: string,
  ) => {
    const message = messages.find((m) => m.id === messageId);
    const image = message?.images?.find(
      (img) => img.id === imageId,
    );

    if (!image?.editPrompt || !currentChatRoomId) {
      console.error("Missing required data for editing:", {
        hasEditPrompt: !!image?.editPrompt,
        hasChatRoomId: !!currentChatRoomId,
      });
      return;
    }

    // Check if the image has a temporary ID or missing ID
    // We convert imageId to string first to be safe
    const idString = String(imageId);
    if (!idString || idString.startsWith("temp-")) {
      alert(
        "Cannot edit this image: Missing valid Image ID from server. Please try regenerating.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.editImage(
        currentChatRoomId,
        idString,
        image.editPrompt,
      );

      setMessages(
        messages.map((msg) => {
          if (msg.id === messageId && msg.images) {
            return {
              ...msg,
              images: msg.images.map((img) => {
                if (img.id === imageId) {
                  // Handle various response formats
                  const newUrl =
                    response.result?.image_path ||
                    response.image_path ||
                    response.url ||
                    img.url;
                  const newId =
                    response.result?.image_id ||
                    response.image_id ||
                    response.id ||
                    img.id;

                  return {
                    ...img,
                    isEditing: false,
                    url: newUrl,
                    id: String(newId),
                    editPrompt: undefined, // Reset edit prompt
                  };
                }
                return img;
              }),
            };
          }
          return msg;
        }),
      );
    } catch (error: any) {
      console.error("Error editing image:", error);
      alert(
        `Failed to edit image: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = (
    messageId: number,
    imageId: string,
  ) => {
    setEditingImageId(null);
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId && msg.images) {
          return {
            ...msg,
            images: msg.images.map((img) =>
              img.id === imageId
                ? {
                    ...img,
                    isEditing: false,
                    editPrompt: undefined,
                  }
                : img,
            ),
          };
        }
        return msg;
      }),
    );
  };

  const handleEditPromptChange = (
    messageId: number,
    imageId: string,
    value: string,
  ) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId && msg.images) {
          return {
            ...msg,
            images: msg.images.map((img) =>
              img.id === imageId
                ? { ...img, editPrompt: value }
                : img,
            ),
          };
        }
        return msg;
      }),
    );
  };

  const handleDownload = async (
    imageUrl: string,
    imageId: string,
  ) => {
    try {
      const cacheBuster = `?t=${new Date().getTime()}`;
      const urlWithCacheBuster = imageUrl.includes("?")
        ? `${imageUrl}&t=${new Date().getTime()}`
        : `${imageUrl}${cacheBuster}`;

      const response = await fetch(urlWithCacheBuster, {
        mode: "cors",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `generated-image-${imageId}.png`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error(
        "Failed to download image directly:",
        error,
      );
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#212121] h-screen lg:h-full relative">
      {/* Chat Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-6 py-4">
        <h2 className="text-white text-lg font-semibold">
          Conversation
        </h2>
        <p className="text-gray-400 text-sm">
          Generate product images with AI
        </p>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
        ref={messagesContainerRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-4xl w-full md:w-auto rounded-lg overflow-hidden ${
                message.role === "user"
                  ? "bg-[#FAEF2F] text-black"
                  : "bg-[#2a2a2a] text-gray-300"
              }`}
            >
              <div className="p-4">
                <p className="text-sm">{message.content}</p>
              </div>

              {message.images && message.images.length > 0 && (
                <>
                  <div
                    className={`p-3 grid gap-4 ${
                      message.images.length === 1
                        ? "grid-cols-1 max-w-sm"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                    }`}
                  >
                    {message.images.map((image) => (
                      <div
                        key={`${message.id}-${image.id}-${image.url}`}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col"
                      >
                        {image.isEditing ? (
                          <div className="bg-[#1a1a1a] p-4 flex flex-col h-full min-h-[300px] border border-[#333]">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-[#FAEF2F] rounded-full"></div>
                              <span className="text-xs text-[#FAEF2F] uppercase tracking-wider font-bold">
                                Edit Prompt
                              </span>
                            </div>
                            <Textarea
                              value={image.editPrompt}
                              onChange={(e) =>
                                handleEditPromptChange(
                                  message.id,
                                  image.id,
                                  e.target.value,
                                )
                              }
                              className="flex-1 bg-[#212121] border-[#4a4a4a] text-white placeholder:text-gray-600 focus:border-[#FAEF2F] focus:ring-1 focus:ring-[#FAEF2F] resize-none rounded-lg p-3 text-sm"
                              placeholder="Describe how you want to modify this image..."
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEditCancel(
                                    message.id,
                                    image.id,
                                  )
                                }
                                className="bg-transparent border-[#4a4a4a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white hover:border-gray-500"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleEditSave(
                                    message.id,
                                    image.id,
                                  )
                                }
                                disabled={loading}
                                className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-bold"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                    <span>Editing...</span>
                                  </>
                                ) : (
                                  "Regenerate"
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="relative group cursor-pointer bg-white aspect-square flex items-center justify-center overflow-hidden"
                              onClick={() =>
                                setZoomedImage(image)
                              }
                            >
                              <img
                                src={image.url}
                                alt="Generated"
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                crossOrigin="anonymous"
                              />

                              {/* Hover Overlay for Zoom Indication */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 drop-shadow-lg" />
                              </div>

                              {/* Download Button - Always visible but styled subtly */}
                              <div
                                className="absolute top-2 right-2 z-10"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent zoom
                                }}
                              >
                                <Button
                                  size="icon"
                                  onClick={() =>
                                    handleDownload(
                                      image.url,
                                      image.id,
                                    )
                                  }
                                  className="bg-black/20 hover:bg-black/60 text-white backdrop-blur-md h-8 w-8 rounded-full shadow-sm transition-all"
                                  title="Download image"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Bottom Action Bar */}
                            <div className="p-3 bg-white flex items-center justify-between border-t border-gray-100">
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  onClick={() =>
                                    handleLike(
                                      message.id,
                                      image.id,
                                    )
                                  }
                                  className={`h-9 w-9 rounded-lg transition-colors ${
                                    image.liked
                                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  <ThumbsUp className="w-5 h-5" />
                                </Button>
                                <Button
                                  size="icon"
                                  onClick={() =>
                                    handleDislike(
                                      message.id,
                                      image.id,
                                    )
                                  }
                                  className={`h-9 w-9 rounded-lg transition-colors ${
                                    image.disliked
                                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  <ThumbsDown className="w-5 h-5" />
                                </Button>
                              </div>
                              <Button
                                onClick={() =>
                                  handleEditClick(
                                    message.id,
                                    image.id,
                                    message.content,
                                  )
                                }
                                disabled={
                                  !image.id ||
                                  image.id
                                    .toString()
                                    .startsWith("temp-")
                                }
                                className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-bold h-9 px-4 rounded-lg flex items-center gap-2 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Regeneration Button */}
                  {message.prompt && (
                    <div className="px-4 pb-4 pt-1 flex justify-end border-t border-[#3a3a3a] mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-[#FAEF2F] hover:bg-white/5 gap-2 mt-2 w-full sm:w-auto"
                        onClick={() =>
                          handleSend(message.prompt)
                        }
                        disabled={loading}
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Regenerate Images
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] rounded-lg p-4 max-w-xs">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#FAEF2F] animate-spin flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Generating your images...
                </p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#212121] border-t border-[#3a3a3a] p-6 z-10">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="bg-[#2a2a2a] border-[#4a4a4a] text-white resize-none min-h-[60px]"
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-semibold"
            size="icon"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/50 rounded-full backdrop-blur-sm"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Main Image */}
            <img
              src={zoomedImage.url}
              alt="Zoomed view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              crossOrigin="anonymous"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />

            {/* Bottom Actions */}
            <div
              className="mt-6 flex gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                onClick={() =>
                  handleDownload(
                    zoomedImage.url,
                    zoomedImage.id,
                  )
                }
                className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-bold px-6 h-12 rounded-full flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Original
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}