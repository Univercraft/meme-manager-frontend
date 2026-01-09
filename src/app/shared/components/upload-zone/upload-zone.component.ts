import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-upload-zone',
  templateUrl: './upload-zone.component.html',
  styleUrls: ['./upload-zone.component.css']
})
export class UploadZoneComponent {
  @Input() acceptedTypes = 'image/*';
  @Input() maxSize = 5 * 1024 * 1024; // 5MB par défaut
  @Output() fileSelected = new EventEmitter<File>();
  @Output() error = new EventEmitter<string>();

  isDragOver = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.error.emit('Seules les images sont acceptées');
      return;
    }

    if (file.size > this.maxSize) {
      this.error.emit(`La taille du fichier ne peut pas dépasser ${this.maxSize / 1024 / 1024}MB`);
      return;
    }

    this.selectedFile = file;
    this.createPreview(file);
    this.fileSelected.emit(file);
  }

  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.fileSelected.emit(null as any);
  }
}
