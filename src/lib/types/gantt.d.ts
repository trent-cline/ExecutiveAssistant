// Type definitions for frappe-gantt
interface GanttOptions {
  header_height?: number;
  column_width?: number;
  step?: number;
  view_modes?: string[];
  bar_height?: number;
  bar_corner_radius?: number;
  arrow_curve?: number;
  padding?: number;
  view_mode?: 'Day' | 'Week' | 'Month';
  date_format?: string;
  popup_trigger?: 'click' | 'hover';
  custom_popup_html?: (task: any) => string;
  language?: string;
}

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress?: number;
  dependencies?: string;
  custom_class?: string;
  projectType?: 'active' | 'mentor' | 'probono';
  parentId?: string;
}

declare global {
  interface Window {
    Gantt: {
      new(container: HTMLElement, tasks: GanttTask[], options?: GanttOptions): any;
      prototype: {
        change_view_mode: (mode: string) => void;
        refresh: (tasks: GanttTask[]) => void;
      }
    }
  }
}

export {};
