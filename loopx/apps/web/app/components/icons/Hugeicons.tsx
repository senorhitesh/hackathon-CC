import React from 'react';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react';
import * as CoreIcons from '@hugeicons/core-free-icons';

export { HugeiconsIcon };
export type { IconSvgElement };

export interface HugeiconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  color?: string;
}

export function createHugeicon(displayName: string, iconData: IconSvgElement) {
  const Component = React.forwardRef<SVGSVGElement, HugeiconProps>(
    ({ size = 20, strokeWidth = 1.5, className = '', color = 'currentColor', ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={iconData}
        size={size}
        strokeWidth={typeof strokeWidth === 'number' ? strokeWidth : parseFloat(strokeWidth as string) || 1.5}
        color={color}
        className={className}
        {...(props as any)}
      />
    )
  );
  Component.displayName = displayName;
  return Component;
}

// ─── OFFICIAL HUGEICONS COMPONENTS ────────────────────────────────────────────

export const PlusSignIcon = createHugeicon('PlusSignIcon', CoreIcons.PlusSignIcon as IconSvgElement);
export const Cancel01Icon = createHugeicon('Cancel01Icon', CoreIcons.Cancel01Icon as IconSvgElement);
export const Tick01Icon = createHugeicon('Tick01Icon', CoreIcons.Tick01Icon as IconSvgElement);
export const CheckmarkCircle02Icon = createHugeicon('CheckmarkCircle02Icon', CoreIcons.CheckmarkCircle02Icon as IconSvgElement);
export const CircleIcon = createHugeicon('CircleIcon', CoreIcons.CircleIcon as IconSvgElement);
export const Search01Icon = createHugeicon('Search01Icon', CoreIcons.Search01Icon as IconSvgElement);
export const Share01Icon = createHugeicon('Share01Icon', CoreIcons.Share01Icon as IconSvgElement);
export const Copy01Icon = createHugeicon('Copy01Icon', CoreIcons.Copy01Icon as IconSvgElement);
export const MessageSquare01Icon = createHugeicon('MessageSquare01Icon', CoreIcons.Comment01Icon as IconSvgElement);
export const PinIcon = createHugeicon('PinIcon', CoreIcons.PinIcon as IconSvgElement);
export const UserGroupIcon = createHugeicon('UserGroupIcon', CoreIcons.UserGroupIcon as IconSvgElement);
export const UserIcon = createHugeicon('UserIcon', CoreIcons.UserIcon as IconSvgElement);
export const UserCheck01Icon = createHugeicon('UserCheck01Icon', CoreIcons.UserCheck01Icon as IconSvgElement);
export const Layers01Icon = createHugeicon('Layers01Icon', CoreIcons.Layers01Icon as IconSvgElement);
export const Image01Icon = createHugeicon('Image01Icon', CoreIcons.Image01Icon as IconSvgElement);
export const Upload01Icon = createHugeicon('Upload01Icon', CoreIcons.Upload01Icon as IconSvgElement);
export const Download01Icon = createHugeicon('Download01Icon', CoreIcons.Download01Icon as IconSvgElement);
export const SparklesIcon = createHugeicon('SparklesIcon', CoreIcons.SparklesIcon as IconSvgElement);
export const Delete01Icon = createHugeicon('Delete01Icon', CoreIcons.Delete01Icon as IconSvgElement);
export const Delete02Icon = createHugeicon('Delete02Icon', CoreIcons.Delete02Icon as IconSvgElement);
export const ZoomInIcon = createHugeicon('ZoomInIcon', CoreIcons.ZoomInIcon as IconSvgElement);
export const ZoomOutIcon = createHugeicon('ZoomOutIcon', CoreIcons.ZoomOutIcon as IconSvgElement);
export const Maximize01Icon = createHugeicon('Maximize01Icon', CoreIcons.Maximize01Icon as IconSvgElement);
export const Minimize01Icon = createHugeicon('Minimize01Icon', CoreIcons.Minimize01Icon as IconSvgElement);
export const SentIcon = createHugeicon('SentIcon', CoreIcons.SentIcon as IconSvgElement);
export const ArrowRight01Icon = createHugeicon('ArrowRight01Icon', CoreIcons.ArrowRight01Icon as IconSvgElement);
export const ArrowLeft01Icon = createHugeicon('ArrowLeft01Icon', CoreIcons.ArrowLeft01Icon as IconSvgElement);
export const ArrowUp01Icon = createHugeicon('ArrowUp01Icon', CoreIcons.ArrowUp01Icon as IconSvgElement);
export const AlertCircleIcon = createHugeicon('AlertCircleIcon', CoreIcons.AlertCircleIcon as IconSvgElement);
export const Loading02Icon = createHugeicon('Loading02Icon', CoreIcons.Loading02Icon as IconSvgElement);
export const LockIcon = createHugeicon('LockIcon', CoreIcons.LockIcon as IconSvgElement);
export const UnlockIcon = createHugeicon('UnlockIcon', (CoreIcons.SquareUnlock02Icon || CoreIcons.Unlock) as IconSvgElement);
export const Move01Icon = createHugeicon('Move01Icon', CoreIcons.Move01Icon as IconSvgElement);
export const CursorPointerIcon = createHugeicon('CursorPointerIcon', CoreIcons.CursorPointerIcon as IconSvgElement);
export const Shield01Icon = createHugeicon('Shield01Icon', CoreIcons.Shield01Icon as IconSvgElement);
export const ViewIcon = createHugeicon('ViewIcon', CoreIcons.ViewIcon as IconSvgElement);
export const ViewOffSlashIcon = createHugeicon('ViewOffSlashIcon', CoreIcons.ViewOffSlashIcon as IconSvgElement);
export const Compass01Icon = createHugeicon('Compass01Icon', CoreIcons.Compass01Icon as IconSvgElement);
export const Wifi01Icon = createHugeicon('Wifi01Icon', CoreIcons.Wifi01Icon as IconSvgElement);
export const Clock01Icon = createHugeicon('Clock01Icon', CoreIcons.Clock01Icon as IconSvgElement);
export const Calendar01Icon = createHugeicon('Calendar01Icon', CoreIcons.Calendar01Icon as IconSvgElement);
export const FilterIcon = createHugeicon('FilterIcon', CoreIcons.FilterIcon as IconSvgElement);
export const Grid01Icon = createHugeicon('Grid01Icon', (CoreIcons.Grid2X2Icon || CoreIcons.Grid) as IconSvgElement);
export const Mic01Icon = createHugeicon('Mic01Icon', CoreIcons.Mic01Icon as IconSvgElement);
export const MicOff01Icon = createHugeicon('MicOff01Icon', CoreIcons.MicOff01Icon as IconSvgElement);
export const CallEndIcon = createHugeicon('CallEndIcon', CoreIcons.CallEndIcon as IconSvgElement);
export const RadioIcon = createHugeicon('RadioIcon', CoreIcons.RadioIcon as IconSvgElement);
export const VolumeHighIcon = createHugeicon('VolumeHighIcon', CoreIcons.VolumeHighIcon as IconSvgElement);
export const TextIcon = createHugeicon('TextIcon', CoreIcons.TextIcon as IconSvgElement);
export const ColorPaletteIcon = createHugeicon('ColorPaletteIcon', (CoreIcons.PaletteIcon || CoreIcons.ColorsIcon) as IconSvgElement);
export const FolderAddIcon = createHugeicon('FolderAddIcon', CoreIcons.FolderAddIcon as IconSvgElement);
export const BotIcon = createHugeicon('BotIcon', CoreIcons.BotIcon as IconSvgElement);
export const CornerDownRightIcon = createHugeicon('CornerDownRightIcon', CoreIcons.CornerDownRightIcon as IconSvgElement);
export const ThumbsUpIcon = createHugeicon('ThumbsUpIcon', CoreIcons.ThumbsUpIcon as IconSvgElement);
export const MoreHorizontalIcon = createHugeicon('MoreHorizontalIcon', CoreIcons.MoreHorizontalIcon as IconSvgElement);
export const RepeatIcon = createHugeicon('RepeatIcon', CoreIcons.RepeatIcon as IconSvgElement);
export const FavouriteIcon = createHugeicon('FavouriteIcon', CoreIcons.FavouriteIcon as IconSvgElement);
export const Bookmark01Icon = createHugeicon('Bookmark01Icon', CoreIcons.Bookmark01Icon as IconSvgElement);
export const Login01Icon = createHugeicon('Login01Icon', CoreIcons.Login01Icon as IconSvgElement);
export const Logout01Icon = createHugeicon('Logout01Icon', CoreIcons.Logout01Icon as IconSvgElement);
export const PlayIcon = createHugeicon('PlayIcon', CoreIcons.PlayIcon as IconSvgElement);
export const Video01Icon = createHugeicon('Video01Icon', CoreIcons.CameraVideoIcon as IconSvgElement);
export const VideoOff01Icon = createHugeicon('VideoOff01Icon', CoreIcons.CameraVideoIcon as IconSvgElement);
export const CameraIcon = createHugeicon('CameraIcon', CoreIcons.CameraIcon as IconSvgElement);
export const UndoIcon = createHugeicon('UndoIcon', CoreIcons.UndoIcon as IconSvgElement);
export const RedoIcon = createHugeicon('RedoIcon', CoreIcons.RedoIcon as IconSvgElement);
export const RotateCcwIcon = createHugeicon('RotateCcwIcon', CoreIcons.ArrowReloadHorizontalIcon as IconSvgElement);
export const LayoutGridIcon = createHugeicon('LayoutGridIcon', CoreIcons.Grid2X2Icon as IconSvgElement);
export const TagIcon = createHugeicon('TagIcon', (CoreIcons.DiscountTag01Icon || CoreIcons.Tag) as IconSvgElement);
export const SquareIcon = createHugeicon('SquareIcon', CoreIcons.SquareIcon as IconSvgElement);
export const AlignLeftIcon = createHugeicon('AlignLeftIcon', CoreIcons.AlignLeftIcon as IconSvgElement);
export const PaperclipIcon = createHugeicon('PaperclipIcon', (CoreIcons.Attachment01Icon || CoreIcons.Paperclip) as IconSvgElement);
export const MenuIcon = createHugeicon('MenuIcon', CoreIcons.Menu01Icon as IconSvgElement);
export const ChevronDownIcon = createHugeicon('ChevronDownIcon', CoreIcons.ArrowDown01Icon as IconSvgElement);
export const ChevronUpIcon = createHugeicon('ChevronUpIcon', CoreIcons.ArrowUp01Icon as IconSvgElement);
export const SidebarIcon = createHugeicon('SidebarIcon', CoreIcons.SidebarLeftIcon as IconSvgElement);
export const MacSidebarIcon = createHugeicon('MacSidebarIcon', CoreIcons.SidebarLeftIcon as IconSvgElement);
export const HomeIcon = createHugeicon('HomeIcon', CoreIcons.Home01Icon as IconSvgElement);
export const DrawerTrayIcon = createHugeicon('DrawerTrayIcon', (CoreIcons.InboxIcon || CoreIcons.Inbox) as IconSvgElement);
export const SparkleChatIcon = createHugeicon('SparkleChatIcon', CoreIcons.SparklesIcon as IconSvgElement);
export const PageWindowIcon = createHugeicon('PageWindowIcon', (CoreIcons.AppWindowIcon || CoreIcons.Browser) as IconSvgElement);
export const HashIcon = createHugeicon('HashIcon', (CoreIcons.HashtagIcon || CoreIcons.HashIcon) as IconSvgElement);
export const FileTextIcon = createHugeicon('FileTextIcon', CoreIcons.File01Icon as IconSvgElement);
export const RefreshCwIcon = createHugeicon('RefreshCwIcon', CoreIcons.ArrowReloadHorizontalIcon as IconSvgElement);
export const ZapIcon = createHugeicon('ZapIcon', CoreIcons.ZapIcon as IconSvgElement);
export const FolderKanbanIcon = createHugeicon('FolderKanbanIcon', CoreIcons.Folder01Icon as IconSvgElement);
export const ExternalLinkIcon = createHugeicon('ExternalLinkIcon', CoreIcons.ExternalLinkIcon as IconSvgElement);

// ─── CONVENIENCE ALIASES (Matching all existing components) ───────────────────

export const Plus = PlusSignIcon;
export const X = Cancel01Icon;
export const Check = Tick01Icon;
export const CheckCircle2 = CheckmarkCircle02Icon;
export const Circle = CircleIcon;
export const Search = Search01Icon;
export const Share2 = Share01Icon;
export const Copy = Copy01Icon;
export const MessageSquare = MessageSquare01Icon;
export const Pin = PinIcon;
export const Users = UserGroupIcon;
export const User = UserIcon;
export const UserCheck = UserCheck01Icon;
export const Layers = Layers01Icon;
export const Image = Image01Icon;
export const Upload = Upload01Icon;
export const Download = Download01Icon;
export const Sparkles = SparklesIcon;
export const Trash2 = Delete01Icon;
export const ZoomIn = ZoomInIcon;
export const ZoomOut = ZoomOutIcon;
export const Maximize2 = Maximize01Icon;
export const Minimize2 = Minimize01Icon;
export const Send = SentIcon;
export const ChevronRight = ArrowRight01Icon;
export const ChevronLeft = ArrowLeft01Icon;
export const ChevronDown = ChevronDownIcon;
export const ChevronUp = ChevronUpIcon;
export const ArrowRight = ArrowRight01Icon;
export const ArrowLeft = ArrowLeft01Icon;
export const ArrowUp = ArrowUp01Icon;
export const AlertCircle = AlertCircleIcon;
export const Loader2 = Loading02Icon;
export const Lock = LockIcon;
export const Unlock = UnlockIcon;
export const Move = Move01Icon;
export const MousePointer = CursorPointerIcon;
export const Shield = Shield01Icon;
export const ShieldCheck = Shield01Icon;
export const Eye = ViewIcon;
export const EyeOff = ViewOffSlashIcon;
export const Compass = Compass01Icon;
export const Wifi = Wifi01Icon;
export const Clock = Clock01Icon;
export const Calendar = Calendar01Icon;
export const Filter = FilterIcon;
export const Grid = Grid01Icon;
export const Mic = Mic01Icon;
export const MicOff = MicOff01Icon;
export const Video = Video01Icon;
export const VideoOff = VideoOff01Icon;
export const PhoneOff = CallEndIcon;
export const Radio = RadioIcon;
export const Volume2 = VolumeHighIcon;
export const Type = TextIcon;
export const Palette = ColorPaletteIcon;
export const FolderPlus = FolderAddIcon;
export const Bot = BotIcon;
export const CornerDownRight = CornerDownRightIcon;
export const ThumbsUp = ThumbsUpIcon;
export const MoreHorizontal = MoreHorizontalIcon;
export const Repeat = RepeatIcon;
export const Heart = FavouriteIcon;
export const Bookmark = Bookmark01Icon;
export const LogIn = Login01Icon;
export const LogOut = Logout01Icon;
export const Play = PlayIcon;
export const Camera = CameraIcon;
export const Undo = UndoIcon;
export const Redo = RedoIcon;
export const RotateCcw = RotateCcwIcon;
export const LayoutGrid = LayoutGridIcon;
export const Tag = TagIcon;
export const Square = SquareIcon;
export const AlignLeft = AlignLeftIcon;
export const Paperclip = PaperclipIcon;
export const Menu = MenuIcon;
export const Sidebar = SidebarIcon;
export const MacSidebar = MacSidebarIcon;
export const Home = HomeIcon;
export const DrawerTray = DrawerTrayIcon;
export const SparkleChat = SparkleChatIcon;
export const PageWindow = PageWindowIcon;
export const Hash = HashIcon;
export const FileText = FileTextIcon;
export const RefreshCw = RefreshCwIcon;
export const Zap = ZapIcon;
export const FolderKanban = FolderKanbanIcon;
export const ExternalLink = ExternalLinkIcon;
