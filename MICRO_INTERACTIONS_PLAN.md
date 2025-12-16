# Micro-Interactions & Animation Plan

## Analysis of Base.org Typography Page

Based on crawling https://www.base.org/brand/typography, here are the key micro-interactions and animations observed:

### 1. **Smooth Scroll Behavior**
- Page uses smooth scrolling
- Scroll-to-top button with fade animation
- Sticky navigation with backdrop blur

### 2. **Hover Effects**
- Navigation items have smooth color transitions
- Cards lift slightly on hover (translate-y)
- Buttons have subtle scale/color changes
- Links have underline animations

### 3. **Fade-In Animations**
- Content fades in on scroll (intersection observer)
- Staggered animations for grid items
- Smooth opacity transitions

### 4. **Interactive Elements**
- Toggle buttons for collapsible sections
- Smooth expand/collapse animations
- Icon rotations on toggle

### 5. **Color Palette (Base Brand)**
- Primary Blue: #0052FF (Base Blue)
- Secondary colors: Cerulean, Tan, Red, Yellow, Pink, Green
- Grayscale ramp for backgrounds
- Gradient overlays

### 6. **Typography Animations**
- Text kerning adjustments on hover
- Smooth font weight transitions
- Letter spacing animations

## Recommended Micro-Interactions for Portfolio

### Priority 1: Core Animations
1. **Fade-in on scroll** - Content appears as user scrolls
2. **Card hover effects** - Lift + shadow + scale image
3. **Button interactions** - Scale + color shift on hover/click
4. **Smooth page transitions** - Fade between pages
5. **Loading states** - Skeleton animations with pulse

### Priority 2: Enhanced Interactions
6. **Staggered grid animations** - Cards appear one by one
7. **Badge animations** - Pulse for featured/new items
8. **Icon animations** - Rotate on hover, bounce on click
9. **Text reveal animations** - Typewriter or fade-in for headings
10. **Progress indicators** - Smooth progress bars

### Priority 3: Advanced Effects
11. **Parallax scrolling** - Subtle background movement
12. **Gradient animations** - Animated gradient backgrounds
13. **Ripple effects** - Click ripple on buttons
14. **Magnetic hover** - Elements slightly follow cursor
15. **Scroll-triggered animations** - Elements animate on scroll

## Implementation Strategy

### Colors (Base Brand Inspired)
- Primary: #0052FF (Base Blue)
- Secondary: #3C8AFF (Cerulean)
- Accent: #FFD12F (Yellow) for highlights
- Success: #66C800 (Green)
- Error: #FC401F (Red)
- Background gradients: Subtle blue-to-purple

### Animation Libraries
- Use CSS transitions/animations (no heavy libraries)
- Framer Motion for complex animations (optional)
- Intersection Observer for scroll animations
- CSS keyframes for custom animations

### Performance Considerations
- Use `will-change` sparingly
- Prefer `transform` and `opacity` for animations
- Reduce motion for users who prefer it
- Lazy load animations

