# Policies & Resistance Timeline - Design Update

## Overview
Complete redesign of the `/policies` page with a visual timeline that distinguishes between **Policy** (official government actions) and **Resistance** (grassroots movements, protests, opposition).

## Features Implemented

### 1. Navigation Bar Update
- Changed label from "Policies" to **"Policies & Resistance"**
- Appears in both desktop and mobile navigation menus

### 2. Page Title
- Changed from "Policy Timeline" to **"Timeline"**
- Updated description to reflect both policies and resistance movements

### 3. Central Vertical Timeline

#### Visual Design
- **Vertical gradient line** running down the center of the page (blue → purple → red)
- **Animated decade markers** (dots) that appear sequentially with smooth transitions
- **Color-coded dots**:
  - 🔵 **Blue**: Only Policy items in that decade
  - 🔴 **Red**: Only Resistance items in that decade
  - 🟣 **Gradient (Blue-Red)**: Both Policy and Resistance in that decade

#### Animation Effects
- **Sequential appearance**: Decades animate in one by one (200ms delay between each)
- **Slide-in effect**: Each decade marker slides in from the left with fade-in
- **Hover interaction**: Dots scale up on hover for better interactivity
- **Smooth transitions**: All animations use CSS transitions for fluidity

### 4. Left-Right Layout

#### Left Side: Resistance
- Red-themed styling
- Border-left accent (red)
- Red-tinted background cards
- Red color scheme for text and tags

#### Right Side: Policy
- Blue-themed styling
- Border-right accent (blue)
- Blue-tinted background cards
- Blue color scheme for text and tags

### 5. Content Organization

Each decade section includes:
- **Decade header** with color-coding matching the timeline dot
- **Two-column grid**:
  - Left column: Resistance movements
  - Right column: Policy initiatives
- Empty columns if no content of that type exists for a decade

## Technical Implementation

### Color Detection Logic
```typescript
const getDecadeColor = (items: PolicyWithRelations[]) => {
  const hasPolicy = items.some((p) => p.genre === "Policy");
  const hasResistance = items.some((p) => p.genre === "Resistance");
  
  if (hasPolicy && hasResistance) return "gradient";
  else if (hasResistance) return "red";
  else return "blue";
};
```

### Animation State Management
- Uses React `useState` to track visible decades
- `useEffect` triggers sequential animations after data loads
- CSS transitions handle smooth appearance effects

### Responsive Design
- Grid layout adapts to different screen sizes
- Timeline remains centered and functional on mobile
- Cards stack appropriately on smaller screens

## Dependencies
The implementation relies on the `genre` field added to the Policy type:
- `"Policy"` - Official government policies
- `"Resistance"` - Grassroots resistance movements

## Backward Compatibility
Existing policies without a genre value will default to "Policy" (as per database schema).

## Future Enhancements (Optional)
- Click on timeline dots to scroll to specific decade
- Filter toggle to show/hide Policy or Resistance
- Export timeline as image/PDF
- Add more detailed year markers between decades
- Interactive tooltips showing summary on hover over timeline dots
