export interface Alert {
  
    id: number;
  
    userId: number;
  
    content: string;
  
    clickAction: number;
  
    clickInfo: string;
  
    viewed: boolean;
  
    timestamp: string | null;
}
