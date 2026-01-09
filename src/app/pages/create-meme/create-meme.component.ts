import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemeService } from '../../shared/services/meme.service';
import { ApiService } from '../../shared/services/api.service';
import { Tag } from '../../shared/interfaces/tag';
import { TagService } from '../../shared/services/tag.service';

@Component({
  selector: 'app-create-meme',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-meme.component.html',
  styleUrls: ['./create-meme.component.css']
})
export class CreateMemeComponent implements OnInit {
  memeForm!: FormGroup;
  tags: Tag[] = [];
  selectedTags: Tag[] = [];
  availableTags: Tag[] = [];
  isLoading = false;
  error = '';
  isEditMode = false;
  memeId?: string;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isCreatingTag = false;
  newTagName = '';
  showTagInput = false;

  constructor(
    private fb: FormBuilder,
    private memeService: MemeService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTags();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.memeId = params['id'];
        if (this.memeId) {  // Vérification null
          this.loadMemeForEdit(this.memeId);
        }
      }
    });
  }

  private initForm(): void {
    this.memeForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      status: ['published', Validators.required]
    });
  }

  private async loadTags(): Promise<void> {
    try {
      this.tags = await this.tagService.getAllTags();
      this.updateAvailableTags();
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  }

  private async loadMemeForEdit(id: string): Promise<void> {
    try {
      const meme = await this.memeService.getMeme(id);
      this.memeForm.patchValue({
        title: meme.title,
        status: meme.status
      });

      if (meme.tags) {
        this.selectedTags = meme.tags
          .map(t => typeof t.tags_id === 'object' ? t.tags_id : null)
          .filter(t => t !== null) as Tag[];
      }
    } catch (error) {
      this.error = 'Meme introuvable';
      console.error('Erreur:', error);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleFile(file);
      } else {
        this.error = 'Veuillez sélectionner une image valide';
      }
    }
  }

  private handleFile(file: File): void {
    this.selectedFile = file;

    // Créer une preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  addTag(tag: Tag): void {
    if (!this.selectedTags.find(t => t.id === tag.id)) {
      this.selectedTags.push(tag);
      this.updateAvailableTags();
    }
  }

  removeTag(tag: Tag): void {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id);
    this.updateAvailableTags();
  }

  private updateAvailableTags(): void {
    this.availableTags = this.tags.filter(
      tag => !this.selectedTags.find(st => st.id === tag.id)
    );
  }

  toggleTagInput(): void {
    this.showTagInput = !this.showTagInput;
    this.newTagName = '';
  }

  async createNewTag(): Promise<void> {
    if (!this.newTagName.trim()) {
      return;
    }

    this.isCreatingTag = true;

    try {
      const newTag = await this.tagService.createTag(this.newTagName);
      this.tags.push(newTag);
      this.selectedTags.push(newTag);
      this.updateAvailableTags();
      this.showTagInput = false;
      this.newTagName = '';
    } catch (error: any) {
      this.error = error.message || 'Erreur lors de la création du tag';
    } finally {
      this.isCreatingTag = false;
    }
  }

  async deleteTag(tag: Tag): Promise<void> {
    if (!confirm(`Supprimer le tag "${tag.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await this.tagService.deleteTag(tag.id);
      this.tags = this.tags.filter(t => t.id !== tag.id);
      this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id);
      this.updateAvailableTags();
    } catch (error: any) {
      this.error = error.message || 'Erreur lors de la suppression du tag';
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.memeForm.valid) return;

    if (!this.isEditMode && !this.selectedFile) {
      this.error = 'Veuillez sélectionner une image';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const formData = {
      title: this.memeForm.value.title,
      status: this.memeForm.value.status,
      tags: this.selectedTags.map(t => t.id)
    };

    try {
      if (this.isEditMode && this.memeId) {
        await this.updateMeme(this.memeId, formData);
      } else {
        await this.createMeme({
          ...formData,
          image: this.selectedFile!
        });
      }
    } catch (error: any) {
      this.isLoading = false;
      
      // Message d'erreur plus explicite
      if (error?.status === 403) {
        this.error = 'Permission refusée. Vérifiez que vous êtes bien connecté et que vos permissions sont correctes.';
      } else if (error?.message) {
        this.error = error.message;
      } else {
        this.error = this.isEditMode 
          ? 'Erreur lors de la mise à jour du meme' 
          : 'Erreur lors de la création du meme';
      }
      
      console.error('Erreur:', error);
    }
  }

  private async createMeme(data: any): Promise<void> {
    const meme = await this.memeService.createMeme(data);
    this.router.navigate(['/meme', meme.id]);
  }

  private async updateMeme(id: string, data: any): Promise<void> {
    const meme = await this.memeService.updateMeme(id, data);
    this.router.navigate(['/meme', meme.id]);
  }

  cancel(): void {
    this.router.navigate(['/gallery']);
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
